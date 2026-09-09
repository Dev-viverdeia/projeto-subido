import 'server-only';
import { setTimeout as esperar } from 'node:timers/promises';
import { Resend, type WebhookEventPayload } from 'resend';
import { z } from 'zod';
import { env, resendEnv } from '@/lib/env';
import { criarSistemaSuporte } from './servidor';

export async function processarNotificacoesSuporte() {
  const db = criarSistemaSuporte();
  const { data: fila, error } = await db.rpc('suporte_notificacoes_reservar');
  if (error) throw new Error('fila_indisponivel');
  const config = resendEnv();
  const resend = config ? new Resend(config.chave) : null;
  let enviadas = 0;
  let falhas = 0;
  for (const item of fila ?? []) {
    // No máximo 20 envios por execução; respeita o limite padrão do provedor.
    if (enviadas + falhas > 0) await esperar(600);
    try {
      if (!resend || !config) throw new Error('configuracao');
      const { data: caso, error: erroCaso } = await db
        .from('suporte_atendimentos')
        .select('numero,dono')
        .eq('id', item.atendimento)
        .single();
      if (erroCaso) throw erroCaso;
      const confirmar = item.tipo === 'verificar';
      const caminho =
        item.tipo === 'equipe'
          ? `/suporte/equipe/${item.atendimento}`
          : caso.dono
            ? `/suporte/${item.atendimento}`
            : `/ajuda/atendimento/${item.atendimento}`;
      const link = confirmar
        ? item.acesso_url
        : new URL(caminho, env.NEXT_PUBLIC_SITE_URL).toString();
      if (!link || new URL(link).origin !== new URL(env.NEXT_PUBLIC_SITE_URL).origin)
        throw new Error('link');
      const assunto = confirmar
        ? 'Confirme seu pedido de ajuda no Subido'
        : `Atualização no atendimento #${caso.numero} · Subido`;
      const texto = confirmar
        ? `Recebemos um pedido de ajuda com este endereço. Abra o link para confirmar e acompanhar a conversa.\n\n${link}\n\nSe não foi você, ignore esta mensagem. Não pedimos senhas ou códigos. O link é pessoal e vale por 14 dias.`
        : `Há uma atualização no atendimento #${caso.numero}.\n\nVeja a conversa e responda pelo Subido:\n${link}\n\nPara manter o histórico em um só lugar, responda pela plataforma. Este e-mail é uma notificação automática.`;
      const resultado = await resend.emails.send(
        {
          from: config.remetente,
          to: [item.destinatario],
          subject: assunto,
          text: texto,
          tags: [{ name: 'suporte_id', value: item.id }],
        },
        { idempotencyKey: `suporte/${item.id}` },
      );
      if (resultado.error || !resultado.data?.id) throw new Error('envio');
      const { error: salvar } = await db
        .from('suporte_notificacoes')
        .update({
          estado: 'enviado',
          provider_id: resultado.data.id,
          erro: null,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('estado', 'enviando');
      if (salvar) throw salvar;
      enviadas++;
    } catch {
      await db
        .from('suporte_notificacoes')
        .update({
          estado: 'falhou',
          erro: 'Não foi possível confirmar o envio.',
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('estado', 'enviando');
      falhas++;
    }
  }
  return { enviadas, falhas };
}

/** Chamado apenas depois da verificação criptográfica do webhook. */
export async function conciliarNotificacaoSuporte(evento: WebhookEventPayload) {
  if (!('email_id' in evento.data)) return false;
  const tags = 'tags' in evento.data ? evento.data.tags : undefined;
  const id = z.uuid().safeParse(tags?.suporte_id);
  if (!id.success) return false;
  const estado =
    evento.type === 'email.delivered'
      ? 'entregue'
      : ['email.bounced', 'email.complained', 'email.suppressed'].includes(evento.type)
        ? 'devolvido'
        : evento.type === 'email.failed'
          ? 'falhou'
          : evento.type === 'email.sent'
            ? 'enviado'
            : null;
  if (!estado) return true;
  const db = criarSistemaSuporte();
  let query = db
    .from('suporte_notificacoes')
    .update({
      estado,
      provider_id: evento.data.email_id,
      erro:
        estado === 'devolvido'
          ? 'O provedor não entregou esta notificação.'
          : estado === 'falhou'
            ? 'O provedor informou falha no envio.'
            : null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id.data);
  if (estado === 'enviado' || estado === 'falhou')
    query = query.in('estado', ['pendente', 'enviando', 'falhou', 'enviado']);
  if (estado === 'entregue') query = query.neq('estado', 'devolvido');
  const { error } = await query;
  if (error) throw new Error('conciliacao_suporte');
  return true;
}
