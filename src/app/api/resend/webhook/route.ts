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

  const admin = createAdminClient();
  const tags = 'tags' in evento.data ? evento.data.tags : undefined;
  const eventoId = tags?.evento_id;
  const fingerprint = tags?.fingerprint;
  const tentativa = tags?.tentativa;
  const identificado =
    typeof eventoId === 'string' &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(eventoId) &&
    typeof fingerprint === 'string' &&
    /^[a-f0-9]{64}$/.test(fingerprint);
  if (!Number.isFinite(Date.parse(evento.created_at))) {
    return NextResponse.json({ erro: 'data_invalida' }, { status: 400 });
  }
  const { error } = await admin.rpc('projeto_email_confirmar', {
    // O gerador do Supabase não representa NULL em argumentos de funções SQL.
    // @ts-expect-error NULL é previsto pela função para eventos legados sem tags.
    p_evento: identificado ? eventoId : null,
    // @ts-expect-error NULL é previsto pela função para eventos legados sem tags.
    p_fingerprint: identificado ? fingerprint : null,
    p_provider_id: evento.data.email_id,
    p_status: estado.status,
    p_ocorrido_em: evento.created_at,
    p_tentativa:
      typeof tentativa === 'string' && /^[a-f0-9]{32}$/.test(tentativa) ? tentativa : undefined,
  });

  if (error) {
    console.error(`[resend:webhook-banco] ${error.code}: ${error.message}`);
    return NextResponse.json({ erro: 'persistencia_indisponivel' }, { status: 500 });
  }

  return NextResponse.json({ recebido: true });
}
