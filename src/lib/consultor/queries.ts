import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/errors';

/**
 * Leituras do Consultor — RSC only, mesma disciplina do builder/queries.ts:
 * sem `.eq('dono', …)` porque a policy É a intenção (só o dono lê).
 */

export type ThreadDoConsultor = {
  id: string;
  titulo: string;
  atualizadoEm: string;
};

export type MensagemDoConsultor = {
  id: string;
  papel: 'usuario' | 'consultor';
  conteudo: string;
  criadoEm: string;
};

export const listarThreads = cache(async (): Promise<ThreadDoConsultor[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('consultor_threads')
    .select('id, titulo, atualizado_em')
    .order('atualizado_em', { ascending: false })
    .limit(40);
  if (error) throw handleError(error, 'consultor:listar');
  return (data ?? []).map((t) => ({ id: t.id, titulo: t.titulo, atualizadoEm: t.atualizado_em }));
});

/** `null` quando o id não existe OU é de outra pessoa — a RLS não distingue. */
export const obterConversa = cache(
  async (
    id: string,
  ): Promise<{ thread: ThreadDoConsultor; mensagens: MensagemDoConsultor[] } | null> => {
    const supabase = await createClient();

    const { data: thread, error } = await supabase
      .from('consultor_threads')
      .select('id, titulo, atualizado_em')
      .eq('id', id)
      .maybeSingle();
    if (error) throw handleError(error, 'consultor:obter');
    if (!thread) return null;

    const { data: mensagens, error: erroMsgs } = await supabase
      .from('consultor_mensagens')
      .select('id, papel, conteudo, criado_em')
      .eq('thread_id', id)
      .order('criado_em')
      .limit(200);
    if (erroMsgs) throw handleError(erroMsgs, 'consultor:mensagens');

    return {
      thread: { id: thread.id, titulo: thread.titulo, atualizadoEm: thread.atualizado_em },
      mensagens: (mensagens ?? []).map((m) => ({
        id: m.id,
        papel: m.papel as 'usuario' | 'consultor',
        conteudo: m.conteudo,
        criadoEm: m.criado_em,
      })),
    };
  },
);
