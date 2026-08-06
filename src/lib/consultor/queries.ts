import 'server-only';

import { cache } from 'react';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/errors';

/**
 * Leituras do Consultor — RSC only, mesma disciplina do builder/queries.ts:
 * sem `.eq('dono', …)` porque a policy É a intenção (só o dono lê).
 */

export type ThreadDoConsultor = {
  id: string;
  titulo: string;
  criadoEm: string;
  atualizadoEm: string;
};

/** Ponteiro para uma solução do catálogo citada na resposta. */
export type CartaoDeSolucao = {
  slug: string;
  titulo: string;
  categoria: string | null;
};

export type MensagemDoConsultor = {
  id: string;
  papel: 'usuario' | 'consultor';
  conteudo: string;
  cartoes: CartaoDeSolucao[];
  criadoEm: string;
};

const Cartoes = z.array(
  z.object({ slug: z.string(), titulo: z.string(), categoria: z.string().nullable() }),
);

export const listarThreads = cache(async (): Promise<ThreadDoConsultor[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('consultor_threads')
    .select('id, titulo, criado_em, atualizado_em')
    .order('atualizado_em', { ascending: false })
    .limit(40);
  if (error) throw handleError(error, 'consultor:listar');
  return (data ?? []).map((t) => ({
    id: t.id,
    titulo: t.titulo,
    criadoEm: t.criado_em,
    atualizadoEm: t.atualizado_em,
  }));
});

/** `null` quando o id não existe OU é de outra pessoa — a RLS não distingue. */
export const obterConversa = cache(
  async (
    id: string,
  ): Promise<{ thread: ThreadDoConsultor; mensagens: MensagemDoConsultor[] } | null> => {
    const supabase = await createClient();

    const { data: thread, error } = await supabase
      .from('consultor_threads')
      .select('id, titulo, criado_em, atualizado_em')
      .eq('id', id)
      .maybeSingle();
    if (error) throw handleError(error, 'consultor:obter');
    if (!thread) return null;

    const { data: mensagens, error: erroMsgs } = await supabase
      .from('consultor_mensagens')
      .select('id, papel, conteudo, cartoes, criado_em')
      .eq('thread_id', id)
      .order('criado_em')
      .limit(200);
    if (erroMsgs) throw handleError(erroMsgs, 'consultor:mensagens');

    return {
      thread: {
        id: thread.id,
        titulo: thread.titulo,
        criadoEm: thread.criado_em,
        atualizadoEm: thread.atualizado_em,
      },
      mensagens: (mensagens ?? []).map((m) => {
        /* `safeParse` no JSONB, como o Builder faz com o documento: cartão em
           formato inesperado vira lista vazia, nunca estouro em `.map`. */
        const cartoes = Cartoes.safeParse(m.cartoes);
        return {
          id: m.id,
          papel: m.papel as 'usuario' | 'consultor',
          conteudo: m.conteudo,
          cartoes: cartoes.success ? cartoes.data : [],
          criadoEm: m.criado_em,
        };
      }),
    };
  },
);
