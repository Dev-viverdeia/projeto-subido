import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/errors';
import type { Tables } from '@/lib/supabase/types.generated';
import { idsPassosProjeto, lerRoteiroProjeto, type RoteiroProjeto } from '@/lib/projetos/roteiro';
import { escolherProxima, type VizinhaSolucao } from './proxima';

export type { VizinhaSolucao };

/**
 * Leituras de conteúdo do lado do ALUNO. Toda página RSC chama daqui — nunca
 * `supabase.from()` inline no page.tsx.
 *
 * POR QUE O `.eq('status', 'publicado')` EXPLÍCITO SE A RLS JÁ FILTRA
 * A policy de leitura é `status = 'publicado' OR private.eh_admin()`. Sem o filtro
 * explícito, um admin navegando na área do aluno veria rascunhos misturados ao
 * catálogo — e revisaria o site num estado que nenhum aluno vê. O filtro daqui
 * garante que a área do aluno mostra o catálogo DO ALUNO para todo mundo; a RLS
 * continua sendo a barreira de segurança, esta é a barreira de fidelidade.
 */

/** `solucao_itens.tipo` é CHECK de texto no banco; o tipo gerado vira `string`. */
export type TipoItem = 'etapa' | 'ferramenta' | 'prompt';

export type ItemSolucao = Omit<Tables<'solucao_itens'>, 'tipo'> & { tipo: TipoItem };

export type DadosRoteiroProjeto = {
  resultado: string;
  clienteIdeal: string;
  entregavelFinal: string;
  roteiro: RoteiroProjeto;
  versao: number;
};

/** Card do catálogo: a solução + contagens reais dos itens (nada de número inventado). */
export type SolucaoResumo = Pick<
  Tables<'solucoes'>,
  'id' | 'slug' | 'titulo' | 'resumo' | 'categoria' | 'publicado_em' | 'criado_em'
> & {
  /** IDs das etapas, não a contagem: é com eles que o card cruza o progresso
      da conta para saber quantas ESTA pessoa já marcou. `.length` dá o total. */
  etapaIds: string[];
  /** Nomes, não contagem: alimentam o painel de facetas e o rodapé do card. */
  ferramentas: string[];
  projeto: DadosRoteiroProjeto | null;
};

export type SolucaoCompleta = Tables<'solucoes'> & {
  itens: ItemSolucao[];
  projeto: DadosRoteiroProjeto | null;
};

export type AulaResumo = Pick<Tables<'aulas'>, 'id' | 'titulo' | 'ordem' | 'duracao_seg'>;

export type ModuloComAulas = Pick<Tables<'modulos'>, 'id' | 'titulo' | 'ordem'> & {
  aulas: AulaResumo[];
};

/** Card do catálogo de formações. `aulaIds` cruza o progresso da conta no cliente. */
export type FormacaoResumo = Pick<
  Tables<'formacoes'>,
  'id' | 'slug' | 'titulo' | 'resumo' | 'capa_url' | 'publicado_em' | 'criado_em'
> & {
  modulos: number;
  aulas: number;
  aulaIds: string[];
};

export type FormacaoCompleta = Pick<
  Tables<'formacoes'>,
  'id' | 'slug' | 'titulo' | 'resumo' | 'capa_url' | 'publicado_em'
> & {
  modulos: ModuloComAulas[];
};

const TIPOS: readonly TipoItem[] = ['etapa', 'ferramenta', 'prompt'];

function ehTipoItem(valor: string): valor is TipoItem {
  return (TIPOS as readonly string[]).includes(valor);
}

/** Narrowing do CHECK do banco. Item com tipo desconhecido é descartado, não quebrado. */
function estreitarItens(itens: Tables<'solucao_itens'>[]): ItemSolucao[] {
  return itens
    .filter((item): item is ItemSolucao => ehTipoItem(item.tipo))
    .sort((a, b) => a.ordem - b.ordem);
}

function montarDadosProjeto(
  registro: Tables<'projeto_roteiros'> | null,
): DadosRoteiroProjeto | null {
  if (!registro) return null;
  const roteiro = lerRoteiroProjeto(registro.roteiro);
  if (!roteiro) return null;
  return {
    resultado: registro.resultado,
    clienteIdeal: registro.cliente_ideal,
    entregavelFinal: registro.entregavel_final,
    roteiro,
    versao: registro.versao,
  };
}

export async function listarSolucoes(): Promise<SolucaoResumo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('solucoes')
    .select(
      'id, slug, titulo, resumo, categoria, publicado_em, criado_em, solucao_itens(id, tipo, titulo, ordem), projeto_roteiros(*)',
    )
    .eq('status', 'publicado')
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: false });

  if (error) throw handleError(error, 'solucoes:listar');

  return (data ?? []).map(({ solucao_itens, projeto_roteiros, ...solucao }) => {
    const projeto = montarDadosProjeto(projeto_roteiros);
    return {
      ...solucao,
      etapaIds: projeto
        ? idsPassosProjeto(solucao.slug, projeto.roteiro)
        : solucao_itens
            .filter((i) => i.tipo === 'etapa')
            .sort((a, b) => a.ordem - b.ordem)
            .map((i) => i.id),
      ferramentas: solucao_itens
        .filter((i) => i.tipo === 'ferramenta')
        .sort((a, b) => a.ordem - b.ordem)
        .map((i) => i.titulo),
      projeto,
    };
  });
}

/* `cache()`: `generateMetadata` e a página pedem o mesmo registro no mesmo render —
   com o cache do React, a segunda chamada reusa a primeira em vez de ir ao banco. */
export const obterSolucao = cache(async (slug: string): Promise<SolucaoCompleta | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('solucoes')
    .select('*, solucao_itens(*), projeto_roteiros(*)')
    .eq('slug', slug)
    .eq('status', 'publicado')
    .maybeSingle();

  if (error) throw handleError(error, 'solucoes:detalhe');
  if (!data) return null;

  const { solucao_itens, projeto_roteiros, ...solucao } = data;
  return {
    ...solucao,
    itens: estreitarItens(solucao_itens),
    projeto: montarDadosProjeto(projeto_roteiros),
  };
});

/** A vizinha desta solução na trilha. A REGRA vive em `proxima.ts`, que é puro
 *  e testado; aqui fica só a leitura. */
export async function obterProximaSolucao(atual: string): Promise<VizinhaSolucao | null> {
  const supabase = await createClient();
  /* A lista inteira, e não um `.gt('ordem', …)`: o catálogo está na casa das
     dezenas, a linha tem quatro colunas curtas, e a alternativa exigiria uma
     PRIMEIRA query só para descobrir a ordem da atual — duas idas ao banco para
     economizar bytes que cabem num pacote. Se o catálogo virar centenas, o lugar
     de resolver isso é um índice em (status, ordem) e um `range`, não aqui. */
  const { data, error } = await supabase
    .from('solucoes')
    .select('slug, titulo, categoria, ordem')
    .eq('status', 'publicado')
    /* O DESEMPATE TEM QUE SER O MESMO DO CATÁLOGO. `listarSolucoes` ordena por
       `ordem ASC, criado_em DESC`, e `ordem` tem default 0 — ou seja, empate é o
       caso NORMAL, não a exceção. Só com `ordem`, o Postgres pode devolver as
       empatadas em qualquer sequência, e "próxima solução" apontaria para um
       lugar diferente do que a grade mostra logo antes. */
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: false });

  if (error) throw handleError(error, 'solucoes:proxima');

  return escolherProxima(data ?? [], atual);
}

export async function listarFormacoes(): Promise<FormacaoResumo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('formacoes')
    .select('id, slug, titulo, resumo, capa_url, publicado_em, criado_em, modulos(id, aulas(id))')
    .eq('status', 'publicado')
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: false });

  if (error) throw handleError(error, 'formacoes:listar');

  return (data ?? []).map(({ modulos, ...formacao }) => {
    const aulaIds = modulos.flatMap((m) => m.aulas.map((a) => a.id));
    return { ...formacao, modulos: modulos.length, aulas: aulaIds.length, aulaIds };
  });
}

export const obterFormacao = cache(async (slug: string): Promise<FormacaoCompleta | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('formacoes')
    .select(
      'id, slug, titulo, resumo, capa_url, publicado_em, modulos(id, titulo, ordem, aulas(id, titulo, ordem, duracao_seg))',
    )
    .eq('slug', slug)
    .eq('status', 'publicado')
    .maybeSingle();

  if (error) throw handleError(error, 'formacoes:detalhe');
  if (!data) return null;

  /* A ordenação é feita AQUI e não por `referencedTable` no PostgREST: dois níveis
     de aninhamento ordenados viram uma query frágil de manter, e o payload é
     pequeno (dezenas de linhas). */
  const modulos = [...data.modulos]
    .sort((a, b) => a.ordem - b.ordem)
    .map((m) => ({ ...m, aulas: [...m.aulas].sort((a, b) => a.ordem - b.ordem) }));

  return { ...data, modulos };
});

/**
 * A aula junto do contexto que a tela do player precisa: a formação, o módulo a
 * que ela pertence e a lista global ordenada (anterior/próxima). Uma query só.
 */
export type ContextoAula = {
  formacao: FormacaoCompleta;
  aula: AulaResumo & { videoUrl: string | null };
  modulo: ModuloComAulas;
  anterior: AulaResumo | null;
  proxima: AulaResumo | null;
  posicao: number;
  total: number;
};

export async function obterAula(slug: string, aulaId: string): Promise<ContextoAula | null> {
  const formacao = await obterFormacao(slug);
  if (!formacao) return null;

  const ordenadas = formacao.modulos.flatMap((m) => m.aulas.map((a) => ({ aula: a, modulo: m })));
  const indice = ordenadas.findIndex(({ aula }) => aula.id === aulaId);
  if (indice === -1) return null;

  const atual = ordenadas[indice];
  if (!atual) return null;

  /* `video_url` fica fora do resumo do currículo de propósito (payload menor);
     para a aula aberta, uma leitura pontual. */
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('aulas')
    .select('video_url')
    .eq('id', aulaId)
    .maybeSingle();

  if (error) throw handleError(error, 'formacoes:aula');

  return {
    formacao,
    aula: { ...atual.aula, videoUrl: data?.video_url ?? null },
    modulo: atual.modulo,
    anterior: ordenadas[indice - 1]?.aula ?? null,
    proxima: ordenadas[indice + 1]?.aula ?? null,
    posicao: indice + 1,
    total: ordenadas.length,
  };
}
