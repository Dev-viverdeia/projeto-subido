import 'server-only';

import { cache } from 'react';
import type { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/errors';
import type { JornadaOperacional } from '@/lib/jornada/queries';
import { hashDoContexto, obterSinaisSobral } from './contexto';
import {
  AcaoConfirmadaCrmSchema,
  criarPlanoBase,
  DirecaoMensagemSchema,
  PlanoSobralSchema,
  type DirecaoMensagem,
  type PlanoSobral,
  type SinaisSobral,
} from './direcao';
import { RecomendacaoProximaAcaoSchema } from './recomendacao';
import { CartoesProdutoPersistidosSchema, type CartaoProduto } from './conteudo';
import type { AnexoDoConsultor } from './anexos-contrato';

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

export type MensagemDoConsultor = {
  id: string;
  papel: 'usuario' | 'consultor';
  conteudo: string;
  anexos: AnexoDoConsultor[];
  cartoes: CartaoProduto[];
  direcao: DirecaoMensagem | null;
  acaoConfirmada: z.infer<typeof AcaoConfirmadaCrmSchema> | null;
  modelo: string | null;
  criadoEm: string;
};

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

/**
 * O produto expõe uma conversa contínua na Início e na página do Sobral AI.
 * Threads antigas não são apagadas: a mais recente é a conversa corrente e o
 * histórico continua disponível na tela completa.
 */
export const obterConversaRecente = cache(async () => {
  const [recente] = await listarThreads();
  return recente ? obterConversa(recente.id) : null;
});

export type PainelSobral = {
  plano: PlanoSobral;
  sinais: SinaisSobral;
  geradoPorIA: boolean;
  desatualizado: boolean;
};

export const obterPainelSobral = cache(
  async (jornada?: JornadaOperacional): Promise<PainelSobral> => {
    const supabase = await createClient();
    const [sinais, plano] = await Promise.all([
      obterSinaisSobral(supabase, jornada),
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
  },
);

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
      .select(
        'id, papel, conteudo, cartoes, direcao, modelo, criado_em, consultor_anexos(id, nome, tipo_mime, tamanho_bytes, categoria), sobral_acoes_crm(acao, quando, confirmada_em, atualizado_em, status, concluida_em, sobral_acoes_crm_eventos(tipo, acao_anterior, acao_nova, quando_anterior, quando_novo, criado_em), sobral_recomendacoes_crm(acao, motivo, fatos, quando, status, modelo, gerada_em, confirmada_em))',
      )
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
        const cartoes = CartoesProdutoPersistidosSchema.safeParse(m.cartoes);
        const direcao = DirecaoMensagemSchema.safeParse(m.direcao);
        const recomendacao = m.sobral_acoes_crm
          ? RecomendacaoProximaAcaoSchema.safeParse(m.sobral_acoes_crm.sobral_recomendacoes_crm)
          : null;
        const recibo = m.sobral_acoes_crm
          ? {
              acao: m.sobral_acoes_crm.acao,
              quando: m.sobral_acoes_crm.quando,
              confirmada_em: m.sobral_acoes_crm.confirmada_em,
              atualizado_em: m.sobral_acoes_crm.atualizado_em,
              status: m.sobral_acoes_crm.status,
              concluida_em: m.sobral_acoes_crm.concluida_em,
              historico: [...m.sobral_acoes_crm.sobral_acoes_crm_eventos].sort((a, b) =>
                a.criado_em.localeCompare(b.criado_em),
              ),
              recomendacao: recomendacao?.success ? recomendacao.data : null,
            }
          : null;
        const acaoConfirmada = AcaoConfirmadaCrmSchema.safeParse(recibo);
        return {
          id: m.id,
          papel: m.papel as 'usuario' | 'consultor',
          conteudo: m.conteudo,
          anexos: (m.consultor_anexos ?? []).map((anexo) => ({
            id: anexo.id,
            nome: anexo.nome,
            tipoMime: anexo.tipo_mime,
            tamanhoBytes: Number(anexo.tamanho_bytes),
            categoria: anexo.categoria as AnexoDoConsultor['categoria'],
          })),
          cartoes: cartoes.success ? cartoes.data : [],
          direcao: direcao.success ? direcao.data : null,
          acaoConfirmada: acaoConfirmada.success ? acaoConfirmada.data : null,
          modelo: m.modelo,
          criadoEm: m.criado_em,
        };
      }),
    };
  },
);
