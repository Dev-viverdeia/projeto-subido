import type Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { planoPeloPriceId, pacotePeloId } from '@/lib/billing/catalogo';
import { obterConfiguracaoBilling, obterStripe } from '@/lib/billing/stripe';
// O webhook é a fronteira confiável de fulfillment e precisa operar como sistema.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function idDoCustomer(
  customer: Stripe.Subscription['customer'] | Stripe.Checkout.Session['customer'],
) {
  if (!customer) return null;
  return typeof customer === 'string' ? customer : customer.id;
}

function idDaAssinatura(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) return null;
  return typeof subscription === 'string' ? subscription : subscription.id;
}

function idDoPaymentIntent(valor: Stripe.Checkout.Session['payment_intent']): string | null {
  if (!valor) return null;
  return typeof valor === 'string' ? valor : valor.id;
}

function periodoFinalDaAssinatura(assinatura: Stripe.Subscription): string | null {
  const finais = assinatura.items.data
    .map((item) => item.current_period_end)
    .filter((valor): valor is number => Number.isFinite(valor));
  if (finais.length === 0) return null;
  return new Date(Math.max(...finais) * 1000).toISOString();
}

async function usuarioDaAssinatura(
  assinatura: Stripe.Subscription,
  customerId: string,
): Promise<string | null> {
  const metadata = assinatura.metadata.usuario_id;
  if (metadata) return metadata;

  const admin = createAdminClient();
  const { data } = await admin
    .from('billing_clientes')
    .select('usuario_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data?.usuario_id ?? null;
}

async function sincronizarAssinatura(
  assinatura: Stripe.Subscription,
  opcoes: { fatura?: string | null; creditar?: boolean } = {},
) {
  const customerId = idDoCustomer(assinatura.customer);
  const item = assinatura.items.data[0];
  const priceId = item?.price.id ?? null;
  const plano = planoPeloPriceId(priceId);
  if (!customerId || !plano) throw new Error('assinatura_sem_catalogo');

  const usuarioId = await usuarioDaAssinatura(assinatura, customerId);
  if (!usuarioId) throw new Error('assinatura_sem_usuario');

  const admin = createAdminClient();
  const { error } = await admin.rpc('billing_sistema_sincronizar_assinatura', {
    p_usuario: usuarioId,
    p_customer: customerId,
    p_subscription: assinatura.id,
    p_plano: plano.plano,
    p_status: assinatura.status,
    p_price: priceId ?? undefined,
    p_creditos: plano.creditos,
    p_cancela_ao_fim: assinatura.cancel_at_period_end,
    p_periodo_termina_em: periodoFinalDaAssinatura(assinatura) ?? undefined,
    p_fatura: opcoes.fatura ?? undefined,
    p_creditar_fatura: opcoes.creditar ?? false,
  });
  if (error) throw new Error(`assinatura_nao_sincronizada:${error.code}`);
}

async function processarPacote(sessao: Stripe.Checkout.Session) {
  if (sessao.mode !== 'payment' || sessao.payment_status !== 'paid') return;

  const usuarioId = sessao.metadata?.usuario_id ?? sessao.client_reference_id;
  const pacoteId = sessao.metadata?.pacote_id;
  const pacote = pacotePeloId(pacoteId);
  const paymentIntentId = idDoPaymentIntent(sessao.payment_intent);
  const customerId = idDoCustomer(sessao.customer);
  if (
    !usuarioId ||
    !pacote ||
    !paymentIntentId ||
    sessao.amount_total === null ||
    !sessao.currency
  ) {
    throw new Error('pagamento_sem_dados_confiaveis');
  }

  const admin = createAdminClient();
  if (customerId) {
    const { error: erroCliente } = await admin.from('billing_clientes').upsert(
      {
        usuario_id: usuarioId,
        stripe_customer_id: customerId,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'usuario_id' },
    );
    if (erroCliente) throw new Error(`cliente_nao_vinculado:${erroCliente.code}`);
  }

  const { error } = await admin.rpc('billing_sistema_pagar_pacote', {
    p_usuario: usuarioId,
    p_session: sessao.id,
    p_payment_intent: paymentIntentId,
    p_pacote: pacote.id,
    p_creditos: pacote.creditos,
    p_valor_total: sessao.amount_total,
    p_moeda: sessao.currency,
  });
  if (error) throw new Error(`pacote_nao_creditado:${error.code}`);
}

async function marcarSessao(sessaoId: string, status: 'falhou' | 'reembolsado') {
  const { error } = await createAdminClient().rpc('billing_sistema_marcar_pedido', {
    p_session: sessaoId,
    p_status: status,
  });
  if (error) throw new Error(`pedido_nao_atualizado:${error.code}`);
}

async function processarEvento(evento: Stripe.Event) {
  const stripe = obterStripe();
  if (!stripe) throw new Error('stripe_indisponivel');

  switch (evento.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await sincronizarAssinatura(evento.data.object);
      return;

    case 'invoice.paid': {
      const invoice = evento.data.object;
      const subscriptionId = idDaAssinatura(invoice);
      if (!subscriptionId) return;
      const assinatura = await stripe.subscriptions.retrieve(subscriptionId);
      await sincronizarAssinatura(assinatura, { fatura: invoice.id, creditar: true });
      return;
    }

    case 'invoice.payment_failed': {
      const subscriptionId = idDaAssinatura(evento.data.object);
      if (!subscriptionId) return;
      await sincronizarAssinatura(await stripe.subscriptions.retrieve(subscriptionId));
      return;
    }

    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await processarPacote(evento.data.object);
      return;

    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired':
      if (evento.data.object.mode === 'payment') {
        await marcarSessao(evento.data.object.id, 'falhou');
      }
      return;

    case 'charge.refunded': {
      const paymentIntent = evento.data.object.payment_intent;
      const paymentIntentId =
        typeof paymentIntent === 'string' ? paymentIntent : (paymentIntent?.id ?? null);
      if (!paymentIntentId) return;
      const admin = createAdminClient();
      const { data } = await admin
        .from('billing_pedidos_creditos')
        .select('stripe_checkout_session_id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle();
      if (data) await marcarSessao(data.stripe_checkout_session_id, 'reembolsado');
      return;
    }

    default:
      return;
  }
}

export async function POST(request: Request) {
  const stripe = obterStripe();
  const configuracao = obterConfiguracaoBilling();
  const assinatura = request.headers.get('stripe-signature');
  if (!stripe || !configuracao || !assinatura) {
    return NextResponse.json({ recebido: false }, { status: 400 });
  }

  let evento: Stripe.Event;
  try {
    evento = await stripe.webhooks.constructEventAsync(
      await request.text(),
      assinatura,
      configuracao.webhook,
    );
  } catch {
    return NextResponse.json({ recebido: false }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: reservado, error: erroReserva } = await admin.rpc(
    'billing_sistema_reservar_evento',
    { p_evento: evento.id, p_tipo: evento.type },
  );
  if (erroReserva) return NextResponse.json({ recebido: false }, { status: 500 });
  if (!reservado) return NextResponse.json({ recebido: true, duplicado: true });

  try {
    await processarEvento(evento);
    const { error } = await admin.rpc('billing_sistema_concluir_evento', {
      p_evento: evento.id,
    });
    if (error) throw new Error(`evento_nao_concluido:${error.code}`);
    return NextResponse.json({ recebido: true });
  } catch (causa) {
    const mensagem = causa instanceof Error ? causa.message : 'falha_sem_detalhe';
    console.error('[billing:webhook]', evento.type, mensagem);
    await admin.rpc('billing_sistema_falhar_evento', {
      p_evento: evento.id,
      p_erro: mensagem,
    });
    return NextResponse.json({ recebido: false }, { status: 500 });
  }
}
