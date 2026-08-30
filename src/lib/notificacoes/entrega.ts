import 'server-only';

import { Resend } from 'resend';
import { resendEnv } from '@/lib/env';
// Serviço server-only: o update administrativo é necessário porque o cliente
// autenticado tem somente leitura no log imutável de eventos do portal.
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
};

async function atualizarEvento(
  eventoId: string,
  alteracao: {
    email_assunto?: string | null;
    email_atualizado_em?: string | null;
    email_destinatario?: string | null;
    email_enviado_em?: string | null;
    email_entregue_em?: string | null;
    email_erro?: string | null;
    email_provider_id?: string | null;
    email_status?: StatusEmailEntrega;
    email_tentativas?: number;
  },
) {
  const admin = createAdminClient();
  const { error } = await admin.from('projeto_portal_eventos').update(alteracao).eq('id', eventoId);
  if (error) {
    console.error(`[notificacao-entrega:evento] ${error.code}: ${error.message}`);
  }
}

export async function marcarNotificacaoSemDestinatario(eventoId: string) {
  await atualizarEvento(eventoId, {
    email_status: 'falhou',
    email_erro: 'destinatario_ausente',
    email_atualizado_em: new Date().toISOString(),
  });
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
  const admin = createAdminClient();
  const { data: evento, error: erroEvento } = await admin
    .from('projeto_portal_eventos')
    .select('email_status, email_tentativas, email_destinatario')
    .eq('id', eventoId)
    .maybeSingle();

  if (erroEvento || !evento) {
    console.error(
      `[notificacao-entrega:consultar] ${erroEvento?.code ?? 'sem-evento'}: ${erroEvento?.message ?? ''}`,
    );
    return { status: 'falhou', destinatario };
  }

  if (
    ['enviado', 'entregue'].includes(evento.email_status) &&
    evento.email_destinatario === destinatario
  ) {
    return { status: 'ja_enviada', destinatario };
  }

  const tentativa = evento.email_tentativas + 1;
  const agora = new Date().toISOString();
  await atualizarEvento(eventoId, {
    email_destinatario: destinatario,
    email_assunto: conteudo.assunto,
    email_status: 'enviando',
    email_tentativas: tentativa,
    email_erro: null,
    email_atualizado_em: agora,
  });

  const configuracao = resendEnv();
  if (!configuracao) {
    await atualizarEvento(eventoId, {
      email_status: 'falhou',
      email_erro: 'configuracao_indisponivel',
      email_atualizado_em: new Date().toISOString(),
    });
    return { status: 'falhou', destinatario };
  }

  try {
    const resend = new Resend(configuracao.chave);
    const { data, error } = await resend.emails.send(
      {
        from: configuracao.remetente,
        to: [destinatario],
        subject: conteudo.assunto,
        html: conteudo.html,
        text: conteudo.texto,
        replyTo: responderPara || undefined,
        headers: { 'X-Subido-Event': eventoId },
        tags: [{ name: 'contexto', value: 'portal_cliente' }],
      },
      { idempotencyKey: `subido-portal-${eventoId}-${tentativa}` },
    );

    if (error || !data?.id) {
      await atualizarEvento(eventoId, {
        email_status: 'falhou',
        email_erro: (error?.message || 'resposta_sem_identificador').slice(0, 500),
        email_atualizado_em: new Date().toISOString(),
      });
      return { status: 'falhou', destinatario };
    }

    const enviadoEm = new Date().toISOString();
    await atualizarEvento(eventoId, {
      email_provider_id: data.id,
      email_status: 'enviado',
      email_erro: null,
      email_enviado_em: enviadoEm,
      email_atualizado_em: enviadoEm,
    });
    return { status: 'enviada', destinatario };
  } catch (erro) {
    await atualizarEvento(eventoId, {
      email_status: 'falhou',
      email_erro: (erro instanceof Error ? erro.message : 'falha_inesperada').slice(0, 500),
      email_atualizado_em: new Date().toISOString(),
    });
    return { status: 'falhou', destinatario };
  }
}
