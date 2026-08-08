import 'server-only';

import { cache } from 'react';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/errors';
import { hashDoContexto, obterSinaisSobral } from './contexto';
import {
  criarPlanoBase,
  DirecaoMensagemSchema,
  PlanoSobralSchema,
  type DirecaoMensagem,
  type PlanoSobral,
  type SinaisSobral,
} from './direcao';

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
  direcao: DirecaoMensagem | null;
  modelo: string | null;
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

export type PainelSobral = {
  plano: PlanoSobral;
  sinais: SinaisSobral;
  geradoPorIA: boolean;
  desatualizado: boolean;
};

export const obterPainelSobral = cache(async (): Promise<PainelSobral> => {
  const supabase = await createClient();
  const [sinais, plano] = await Promise.all([
    obterSinaisSobral(supabase),
    supabase
      .from('sobral_planos')
      .select(
        'etapa, diagnostico, foco, proximo_passo, acoes, sinais, contexto_hash, modelo, gerado_em',
      )
      .maybeSingle(),
  ]);

  if (plano.error) throw handleError(plano.error, 'sobral:plano');

  const base = criarPlanoBase(sinais);
  if (!plano.data) return { plano: base, sinais, geradoPorIA: false, desatualizado: false };

  const lido = PlanoSobralSchema.safeParse({
    etapa: plano.data.etapa,
    diagnostico: plano.data.diagnostico,
    foco: plano.data.foco,
    proximoPasso: plano.data.proximo_passo,
    acoes: plano.data.acoes,
    sinais: plano.data.sinais,
    modelo: plano.data.modelo,
    geradoEm: plano.data.gerado_em,
  });
  const desatualizado = plano.data.contexto_hash !== hashDoContexto(sinais);

  if (!lido.success || desatualizado) {
    return { plano: base, sinais, geradoPorIA: false, desatualizado };
  }
  return { plano: lido.data, sinais, geradoPorIA: true, desatualizado: false };
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
      .select('id, papel, conteudo, cartoes, direcao, modelo, criado_em')
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
        const direcao = DirecaoMensagemSchema.safeParse(m.direcao);
        return {
          id: m.id,
          papel: m.papel as 'usuario' | 'consultor',
          conteudo: m.conteudo,
          cartoes: cartoes.success ? cartoes.data : [],
          direcao: direcao.success ? direcao.data : null,
          modelo: m.modelo,
          criadoEm: m.criado_em,
        };
      }),
    };
  },
);
