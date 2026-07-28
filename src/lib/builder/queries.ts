import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/errors';
import type { Tables } from '@/lib/supabase/types.generated';
import { DocumentoSolucao, RespostaClarificacao } from './schema';

/**
 * Leituras do Builder. As páginas RSC chamam daqui — nunca `supabase.from()`
 * inline no page.tsx.
 *
 * SEM `.eq('dono', …)` EXPLÍCITO, E ISSO É DIFERENTE DAS OUTRAS QUERIES
 * Em `conteudo/queries.ts` o `.eq('status','publicado')` existe porque a policy é
 * mais larga que a intenção: ela deixa admin ver rascunho. Aqui a policy é
 * EXATAMENTE a intenção — só o dono lê. Repetir o filtro no cliente não
 * acrescentaria barreira nenhuma e sugeriria que a RLS não basta.
 *
 * O JSONB VOLTA COMO `Json`, NÃO COMO O DOCUMENTO
 * O tipo gerado do Postgres não sabe a forma do JSONB. O narrowing é feito aqui,
 * pelo mesmo Zod que gerou o documento, com `safeParse`: um documento gravado por
 * uma versão anterior do schema vira `null` e a tela diz que não consegue exibir —
 * em vez de estourar num `.map` de campo que não existe mais.
 */

export type LinhaBuilder = Tables<'builder_solucoes'>;

export type SolucaoBuilder = {
  id: string;
  titulo: string;
  ideiaOriginal: string;
  respostas: RespostaClarificacao[];
  documento: DocumentoSolucao | null;
  /** `true` quando há JSONB gravado que o schema atual não reconhece. */
  documentoIlegivel: boolean;
  status: LinhaBuilder['status'];
  erro: string | null;
  modelo: string | null;
  criadoEm: string;
};

const ListaDeRespostas = RespostaClarificacao.array();

function montar(linha: LinhaBuilder): SolucaoBuilder {
  const respostas = ListaDeRespostas.safeParse(linha.respostas);
  const documento = linha.documento ? DocumentoSolucao.safeParse(linha.documento) : null;

  return {
    id: linha.id,
    titulo: linha.titulo,
    ideiaOriginal: linha.ideia_original,
    respostas: respostas.success ? respostas.data : [],
    documento: documento?.success ? documento.data : null,
    documentoIlegivel: documento !== null && !documento.success,
    status: linha.status,
    erro: linha.erro,
    modelo: linha.modelo,
    criadoEm: linha.criado_em,
  };
}

/** Cartão do histórico. Não carrega o `documento` — ele pesa e não é exibido na lista. */
export type ItemHistorico = {
  id: string;
  titulo: string;
  ideiaOriginal: string;
  status: LinhaBuilder['status'];
  criadoEm: string;
};

/**
 * `cache()` do React: a mesma renderização pode pedir a lista mais de uma vez
 * (contador do topo e grade), e sem isso seriam duas idas ao banco por request.
 */
export const listarSolucoesDoBuilder = cache(async (): Promise<ItemHistorico[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('builder_solucoes')
    .select('id, titulo, ideia_original, status, criado_em')
    .order('criado_em', { ascending: false })
    .limit(60);

  if (error) throw handleError(error, 'builder:listar');

  return (data ?? []).map((linha) => ({
    id: linha.id,
    titulo: linha.titulo,
    ideiaOriginal: linha.ideia_original,
    status: linha.status,
    criadoEm: linha.criado_em,
  }));
});

/** `null` quando o id não existe OU pertence a outra pessoa — a RLS não distingue. */
export const obterSolucaoDoBuilder = cache(async (id: string): Promise<SolucaoBuilder | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('builder_solucoes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw handleError(error, 'builder:obter');
  return data ? montar(data) : null;
});
