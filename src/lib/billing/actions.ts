'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { env } from '@/lib/env';
// Fulfillment e criação de pedidos são operações internas; nenhuma service role cruza para o cliente.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { pacotePeloId } from './catalogo';
import { identificadorIntegracao, obterConfiguracaoBilling, obterStripe } from './stripe';

const PlanoSchema = z.enum(['starter', 'pro']);
const PacoteSchema = z.enum(['essencial', 'crescimento', 'escala']);

function destinoConta(caminho: string): string {
  return new URL(caminho, env.NEXT_PUBLIC_SITE_URL).toString();
}

async function contextoUsuario() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar?proximo=/conta/assinatura');

  const [{ data: cliente }, { data: assinatura }] = await Promise.all([
    supabase.from('billing_clientes').select('stripe_customer_id').maybeSingle(),
    supabase
      .from('billing_assinaturas')
      .select('stripe_customer_id, status')
      .in('status', ['active', 'trialing', 'past_due'])
      .maybeSingle(),
  ]);

  return {
    user,
    customerId: cliente?.stripe_customer_id ?? assinatura?.stripe_customer_id ?? null,
    possuiAssinatura: Boolean(assinatura),
  };
}

async function criarPortal(customerId: string): Promise<string> {
  const stripe = obterStripe();
  const configuracao = obterConfiguracaoBilling();
  if (!stripe || !configuracao) throw new Error('billing_indisponivel');

  const sessao = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: destinoConta('/conta/assinatura?portal=retorno'),
    ...(configuracao.portal ? { configuration: configuracao.portal } : {}),
  });
  return sessao.url;
}

export async function iniciarAssinatura(formData: FormData): Promise<void> {
  const planoValidado = PlanoSchema.safeParse(formData.get('plano'));
  if (!planoValidado.success) redirect('/conta/assinatura?checkout=plano-invalido');

  const plano = planoValidado.data;
  let destino: string | null = null;

  try {
    const stripe = obterStripe();
    const configuracao = obterConfiguracaoBilling();
    if (!stripe || !configuracao) throw new Error('billing_indisponivel');

    const contexto = await contextoUsuario();
    if (contexto.possuiAssinatura && contexto.customerId) {
      destino = await criarPortal(contexto.customerId);
    } else {
      const priceId = configuracao.planos[plano].priceId;
      if (!priceId) throw new Error('preco_indisponivel');

      const sessao = await stripe.checkout.sessions.create(
        {
          mode: 'subscription',
          line_items: [{ price: priceId, quantity: 1 }],
          client_reference_id: contexto.user.id,
          ...(contexto.customerId
            ? { customer: contexto.customerId }
            : contexto.user.email
              ? { customer_email: contexto.user.email }
              : {}),
          allow_promotion_codes: true,
          success_url: destinoConta('/conta/assinatura?checkout=sucesso'),
          cancel_url: destinoConta('/conta/assinatura?checkout=cancelado'),
          metadata: {
            usuario_id: contexto.user.id,
            tipo: 'assinatura',
            plano,
          },
          subscription_data: {
            metadata: {
              usuario_id: contexto.user.id,
              plano,
            },
          },
          integration_identifier: identificadorIntegracao('assinatura'),
        },
        {
          idempotencyKey: `subido:assinatura:${contexto.user.id}:${plano}:${Math.floor(Date.now() / 60_000)}`,
        },
      );
      destino = sessao.url;
    }
  } catch (causa) {
    console.error('[billing:checkout:assinatura]', causa instanceof Error ? causa.message : causa);
  }

  redirect(destino ?? '/conta/assinatura?checkout=indisponivel');
}

export async function comprarPacoteCreditos(formData: FormData): Promise<void> {
  const pacoteValidado = PacoteSchema.safeParse(formData.get('pacote'));
  if (!pacoteValidado.success) redirect('/conta/creditos?checkout=pacote-invalido');

  const pacoteId = pacoteValidado.data;
  let destino: string | null = null;

  try {
    const stripe = obterStripe();
    const configuracao = obterConfiguracaoBilling();
    const pacote = pacotePeloId(pacoteId);
    const priceId = configuracao?.pacotes[pacoteId] ?? null;
    if (!stripe || !configuracao || !pacote || !priceId) {
      throw new Error('pacote_indisponivel');
    }

    const contexto = await contextoUsuario();
    const sessao = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: contexto.user.id,
        ...(contexto.customerId
          ? { customer: contexto.customerId }
          : {
              customer_creation: 'always',
              ...(contexto.user.email ? { customer_email: contexto.user.email } : {}),
            }),
        success_url: destinoConta('/conta/creditos?checkout=sucesso'),
        cancel_url: destinoConta('/conta/creditos?checkout=cancelado'),
        metadata: {
          usuario_id: contexto.user.id,
          tipo: 'pacote_creditos',
          pacote_id: pacoteId,
        },
        payment_intent_data: {
          metadata: {
            usuario_id: contexto.user.id,
            pacote_id: pacoteId,
          },
        },
        integration_identifier: identificadorIntegracao('creditos'),
      },
      {
        idempotencyKey: `subido:creditos:${contexto.user.id}:${pacoteId}:${Math.floor(Date.now() / 60_000)}`,
      },
    );

    const admin = createAdminClient();
    const { error } = await admin.rpc('billing_sistema_criar_pedido', {
      p_usuario: contexto.user.id,
      p_session: sessao.id,
      p_pacote: pacoteId,
      p_creditos: pacote.creditos,
    });
    if (error) {
      await stripe.checkout.sessions.expire(sessao.id).catch(() => undefined);
      throw new Error(`pedido_nao_registrado:${error.code}`);
    }
    destino = sessao.url;
  } catch (causa) {
    console.error('[billing:checkout:creditos]', causa instanceof Error ? causa.message : causa);
  }

  redirect(destino ?? '/conta/creditos?checkout=indisponivel');
}

export async function abrirPortalCobranca(): Promise<void> {
  let destino: string | null = null;
  try {
    const contexto = await contextoUsuario();
    if (!contexto.customerId) throw new Error('cliente_sem_cobranca');
    destino = await criarPortal(contexto.customerId);
  } catch (causa) {
    console.error('[billing:portal]', causa instanceof Error ? causa.message : causa);
  }
  redirect(destino ?? '/conta/assinatura?portal=indisponivel');
}
