import 'server-only';
import { setTimeout as esperar } from 'node:timers/promises';
import type { WebhookEventPayload } from 'resend';
import { z } from 'zod';
import { env, resendEnv, suporteEmailEnv } from '@/lib/env';
import { criarSistemaSuporte } from './servidor';
import { enderecoResposta, escaparHtml, idMensagemSeguro } from './email-contrato';
import { ResendSuporte } from './resend-worker';

export async function processarNotificacoesSuporte(signal = AbortSignal.timeout(40_000)) {
  const db = criarSistemaSuporte({ signal });
  const config = resendEnv();
  if (!config) throw new Error('configuracao');
  const resend = new ResendSuporte(config.chave, signal);
  const receber = suporteEmailEnv();
  let enviadas = 0;
  let falhas = 0;
  for (let indice = 0; indice < 20; indice++) {
    signal.throwIfAborted();
    // Só reserva o próximo item quando pode processá-lo. A RPC também protege
    // contra cron sobreposto; 650ms dá margem ao intervalo global de 600ms.
    if (indice > 0) await esperar(650, undefined, { signal });
    const { data: fila, error } = await db.rpc('suporte_notificacoes_reservar');
    if (error) throw new Error('fila_indisponivel');
    const item = fila?.[0];
    if (!item) break;
    try {
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
      let mensagem = '';
      if (item.tipo === 'usuario' && z.uuid().safeParse(item.evento).success) {
        const { data: m, error: erroMensagem } = await db
          .from('suporte_mensagens')
          .select('texto,papel,interna')
          .eq('id', item.evento)
          .eq('atendimento', item.atendimento)
          .maybeSingle();
        if (erroMensagem) throw erroMensagem;
        if (m && !m.interna && m.papel === 'equipe') mensagem = m.texto;
      }
      const podeResponder = !!receber && item.tipo === 'usuario' && !confirmar;
      let referencia: string | null = null;
      if (podeResponder) {
        const { data: ultimo, error: erroReferencia } = await db
          .from('suporte_email_recebidos')
          .select('message_id')
          .eq('atendimento', item.atendimento)
          .eq('estado', 'processado')
          .order('criado_em', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (erroReferencia) throw erroReferencia;
        referencia = idMensagemSeguro(ultimo?.message_id);
      }
      const orientacao = podeResponder
        ? 'Você pode responder a este e-mail ou continuar pelo Subido.'
        : 'Veja a conversa e responda pelo Subido.';
      const texto = confirmar
        ? `Recebemos um pedido de ajuda com este endereço. Abra o link para confirmar e acompanhar a conversa.\n\n${link}\n\nSe não foi você, ignore esta mensagem. Não pedimos senhas ou códigos. O link é pessoal e vale por 14 dias.`
        : `${mensagem || `Há uma atualização no atendimento #${caso.numero}.`}\n\n${orientacao}\n${link}\n\nEquipe Subido · Não compartilhe senhas ou códigos de acesso.`;
      const resultado = await resend.emails.send(
        {
          from: config.remetente.replace(/^Subido </, 'Equipe Subido <'),
          to: [item.destinatario],
          subject: assunto,
          text: texto,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:24px auto;padding:28px;line-height:1.65"><p><strong>Subido</strong> · Central de ajuda</p><h2 style="font-size:22px">${confirmar ? 'Confirme seu pedido de ajuda' : `Atendimento #${caso.numero}`}</h2><p style="white-space:pre-wrap;font-size:16px">${escaparHtml(confirmar ? 'Abra o link para confirmar e acompanhar seu pedido. Se não foi você, ignore este e-mail.' : mensagem || 'Há uma atualização na sua conversa.')}</p><p><a href="${escaparHtml(link)}">${confirmar ? 'Confirmar pedido' : 'Ver atendimento'}</a></p><p>${escaparHtml(confirmar ? 'O link é pessoal e vale por 14 dias.' : orientacao)}</p><hr><p>Equipe Subido · Não pedimos senhas ou códigos.</p></div>`,
          ...(podeResponder && receber
            ? { replyTo: enderecoResposta(item.atendimento, receber.dominio, receber.chave) }
            : {}),
          headers: {
            'Auto-Submitted': 'auto-generated',
            'X-Auto-Response-Suppress': 'All',
            'Message-ID': `<suporte-${item.id}@subido.viverdeia.ai>`,
            ...(referencia ? { 'In-Reply-To': referencia, References: referencia } : {}),
          },
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
      // Com o ciclo esgotado, a lease permite retomada. Não inicia outra escrita
      // sem confirmação nem muda a chave de idempotência do envio.
      signal.throwIfAborted();
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
