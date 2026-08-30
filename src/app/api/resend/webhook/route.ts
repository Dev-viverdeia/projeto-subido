import { NextResponse } from 'next/server';
import { Resend, type WebhookEventPayload } from 'resend';
import { resendEnv } from '@/lib/env';
import type { StatusEmailEntrega } from '@/lib/notificacoes/entrega';
// Endpoint estritamente server-only: o service role apenas concilia o ID do
// provedor após validar criptograficamente a assinatura do Resend.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

function estadoDoEvento(evento: WebhookEventPayload): {
  status: StatusEmailEntrega;
  erro: string | null;
  entregue: boolean;
} | null {
  switch (evento.type) {
    case 'email.sent':
      return { status: 'enviado', erro: null, entregue: false };
    case 'email.delivered':
      return { status: 'entregue', erro: null, entregue: true };
    case 'email.delivery_delayed':
      return { status: 'atrasado', erro: 'entrega_atrasada', entregue: false };
    case 'email.failed':
      return { status: 'falhou', erro: evento.data.failed.reason, entregue: false };
    case 'email.bounced':
      return { status: 'devolvido', erro: evento.data.bounce.message, entregue: false };
    case 'email.complained':
      return { status: 'reclamado', erro: 'marcado_como_spam', entregue: false };
    case 'email.suppressed':
      return { status: 'suprimido', erro: evento.data.suppressed.message, entregue: false };
    default:
      return null;
  }
}

export async function POST(request: Request) {
  const configuracao = resendEnv();
  if (!configuracao?.webhook) {
    return NextResponse.json({ erro: 'webhook_indisponivel' }, { status: 503 });
  }

  const corpo = await request.text();
  const assinatura = {
    id: request.headers.get('svix-id'),
    timestamp: request.headers.get('svix-timestamp'),
    signature: request.headers.get('svix-signature'),
  };
  if (!assinatura.id || !assinatura.timestamp || !assinatura.signature) {
    return NextResponse.json({ erro: 'assinatura_ausente' }, { status: 400 });
  }
  let evento: WebhookEventPayload;
  try {
    evento = new Resend(configuracao.chave).webhooks.verify({
      payload: corpo,
      headers: assinatura as { id: string; timestamp: string; signature: string },
      webhookSecret: configuracao.webhook,
    });
  } catch (erro) {
    console.error(
      `[resend:webhook-assinatura] ${erro instanceof Error ? erro.message : 'assinatura_invalida'}`,
    );
    return NextResponse.json({ erro: 'assinatura_invalida' }, { status: 400 });
  }

  const estado = estadoDoEvento(evento);
  if (!estado || !('email_id' in evento.data)) {
    return NextResponse.json({ recebido: true });
  }

  const agora = new Date().toISOString();
  const admin = createAdminClient();
  const { error } = await admin
    .from('projeto_portal_eventos')
    .update({
      email_status: estado.status,
      email_erro: estado.erro?.slice(0, 500) ?? null,
      ...(estado.entregue ? { email_entregue_em: evento.created_at || agora } : {}),
      email_atualizado_em: evento.created_at || agora,
    })
    .eq('email_provider_id', evento.data.email_id);

  if (error) {
    console.error(`[resend:webhook-banco] ${error.code}: ${error.message}`);
    return NextResponse.json({ erro: 'persistencia_indisponivel' }, { status: 500 });
  }

  return NextResponse.json({ recebido: true });
}
