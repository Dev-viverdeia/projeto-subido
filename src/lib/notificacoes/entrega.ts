import 'server-only';

import { createHash } from 'node:crypto';
import { Resend } from 'resend';
import { resendEnv } from '@/lib/env';
// Serviço server-only: somente o backend pode reservar e conciliar notificações.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import type { ConteudoEmailEntrega } from './entrega-email';

export type StatusEmailEntrega =
  | 'nao_solicitado'
  | 'enviando'
  | 'enviado'
  | 'entregue'
  | 'atrasado'
  | 'falhou'
  | 'devolvido'
  | 'reclamado'
  | 'suprimido';

export type ResultadoNotificacaoEntrega = {
  status: 'enviada' | 'ja_enviada' | 'falhou';
  destinatario: string | null;
  motivo?: string;
};

export async function marcarNotificacaoSemDestinatario(eventoId: string) {
  const { error } = await createAdminClient()
    .from('projeto_portal_eventos')
    .update({
      email_status: 'falhou',
      email_erro: 'destinatario_ausente',
      email_atualizado_em: new Date().toISOString(),
    })
    .eq('id', eventoId)
    .eq('email_status', 'nao_solicitado');
  if (error) console.error('[notificacao-entrega:destinatario]', error.code);
}

export async function enviarNotificacaoEntrega({
  eventoId,
  destinatario,
  conteudo,
  responderPara,
}: {
  eventoId: string;
  destinatario: string;
  conteudo: ConteudoEmailEntrega;
  responderPara?: string | null;
}): Promise<ResultadoNotificacaoEntrega> {
  const configuracao = resendEnv();
  if (!configuracao) return { status: 'falhou', destinatario, motivo: 'configuracao_indisponivel' };
  const admin = createAdminClient();
  const destino = destinatario.trim().toLowerCase();
  const payload = {
    from: configuracao.remetente,
    to: [destino],
    subject: conteudo.assunto.slice(0, 240),
    html: conteudo.html,
    text: conteudo.texto,
    replyTo: responderPara || undefined,
    headers: { 'X-Subido-Event': eventoId },
  };
  const fingerprint = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const { data, error } = await admin.rpc('projeto_email_reservar', {
    p_evento: eventoId,
    p_destinatario: destino,
    p_assunto: payload.subject,
    p_fingerprint: fingerprint,
  });
  if (error || !data || typeof data !== 'object' || Array.isArray(data)) {
    console.error('[notificacao-entrega:reserva]', error?.code ?? 'resposta_invalida');
    return { status: 'falhou', destinatario, motivo: 'reserva_indisponivel' };
  }
  if (data.resultado === 'ja_enviada')
    return {
      status: 'ja_enviada',
      destinatario: typeof data.destinatario === 'string' ? data.destinatario : destinatario,
    };
  if (
    data.resultado !== 'reservada' ||
    typeof data.chave !== 'string' ||
    typeof data.inicio !== 'string'
  )
    return {
      status: 'falhou',
      destinatario,
      motivo: typeof data.resultado === 'string' ? data.resultado : 'resposta_invalida',
    };
  const tentativa = createHash('md5').update(data.chave).digest('hex');
  const inicio = data.inicio;

  async function falhar(motivo: 'envio_recusado' | 'envio_incerto') {
    // Um webhook que já confirmou o envio tem precedência sobre uma falha local.
    const { error } = await admin
      .from('projeto_portal_eventos')
      .update({
        email_status: 'falhou',
        email_erro: motivo,
        email_atualizado_em: new Date().toISOString(),
      })
      .eq('id', eventoId)
      .eq('email_fingerprint', fingerprint)
      .eq('email_primeira_tentativa_em', inicio)
      .eq('email_status', 'enviando');
    if (error) console.error('[notificacao-entrega:falha]', error.code);
    return { status: 'falhou', destinatario, motivo } as const;
  }

  try {
    const resposta = await new Resend(configuracao.chave).emails.send(
      {
        ...payload,
        tags: [
          { name: 'contexto', value: 'portal_cliente' },
          { name: 'evento_id', value: eventoId },
          { name: 'fingerprint', value: fingerprint },
          { name: 'tentativa', value: tentativa },
        ],
      },
      { idempotencyKey: data.chave },
    );
    if (resposta.error || !resposta.data?.id) {
      const code = resposta.error?.statusCode;
      const recusado = code && [400, 401, 403, 404, 405, 413, 422].includes(code);
      return await falhar(recusado ? 'envio_recusado' : 'envio_incerto');
    }
    const confirmacao = await admin.rpc('projeto_email_confirmar', {
      p_evento: eventoId,
      p_fingerprint: fingerprint,
      p_provider_id: resposta.data.id,
      p_status: 'enviado',
      p_ocorrido_em: new Date().toISOString(),
      p_tentativa: tentativa,
    });
    if (confirmacao.error || !confirmacao.data) return await falhar('envio_incerto');
    return { status: 'enviada', destinatario };
  } catch {
    return await falhar('envio_incerto');
  }
}
