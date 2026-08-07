import 'server-only';

import { cache } from 'react';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types.generated';
import type { EtapaCrm } from './etapas';

type LinhaOportunidade = Tables<'crm_oportunidades'>;

export type OportunidadeCrm = {
  id: string;
  titulo: string;
  etapa: EtapaCrm;
  empresaId: string;
  empresa: string;
  contatoId: string | null;
  contato: string | null;
  contatoEmail: string | null;
  valorCentavos: number | null;
  proximaAcao: string | null;
  proximaAcaoEm: string | null;
  ultimoFato: string | null;
  ultimoFatoEm: string | null;
  atualizadoEm: string;
  criadoEm: string;
};

/**
 * Pipeline privado do profissional.
 *
 * As quatro leituras viajam em paralelo. Elas ficam separadas em vez de um join
 * profundo porque as FKs compostas (a barreira contra vínculo entre contas)
 * tornam o payload inferido do PostgREST desnecessariamente complexo. Aqui os
 * mapas deixam a montagem linear e o contrato devolvido à tela fica pequeno.
 */
export const listarPipeline = cache(async (): Promise<OportunidadeCrm[]> => {
  const supabase = await createClient();

  const [oportunidades, empresas, contatos, eventos] = await Promise.all([
    supabase
      .from('crm_oportunidades')
      .select(
        'id, titulo, etapa, empresa_id, contato_principal_id, valor_centavos, proxima_acao, proxima_acao_em, atualizado_em, criado_em, ordem',
      )
      .order('ordem', { ascending: false })
      .limit(300),
    supabase.from('crm_empresas').select('id, nome').limit(500),
    supabase.from('crm_contatos').select('id, nome, email').limit(800),
    supabase
      .from('crm_eventos')
      .select('oportunidade_id, titulo, ocorrido_em')
      .order('ocorrido_em', { ascending: false })
      .limit(800),
  ]);

  if (oportunidades.error) throw handleError(oportunidades.error, 'crm:pipeline');
  if (empresas.error) throw handleError(empresas.error, 'crm:empresas');
  if (contatos.error) throw handleError(contatos.error, 'crm:contatos');
  if (eventos.error) throw handleError(eventos.error, 'crm:eventos');

  const empresaPorId = new Map((empresas.data ?? []).map((empresa) => [empresa.id, empresa.nome]));
  const contatoPorId = new Map((contatos.data ?? []).map((contato) => [contato.id, contato]));
  const ultimoFatoPorOportunidade = new Map<string, { titulo: string; ocorrido_em: string }>();

  /* A query já veio decrescente. O primeiro evento visto é o mais recente. */
  for (const evento of eventos.data ?? []) {
    if (!ultimoFatoPorOportunidade.has(evento.oportunidade_id)) {
      ultimoFatoPorOportunidade.set(evento.oportunidade_id, evento);
    }
  }

  return (oportunidades.data ?? []).map((linha) =>
    montarOportunidade(linha, empresaPorId, contatoPorId, ultimoFatoPorOportunidade),
  );
});

function montarOportunidade(
  linha: Pick<
    LinhaOportunidade,
    | 'id'
    | 'titulo'
    | 'etapa'
    | 'empresa_id'
    | 'contato_principal_id'
    | 'valor_centavos'
    | 'proxima_acao'
    | 'proxima_acao_em'
    | 'atualizado_em'
    | 'criado_em'
  >,
  empresas: Map<string, string>,
  contatos: Map<string, { id: string; nome: string; email: string | null }>,
  eventos: Map<string, { titulo: string; ocorrido_em: string }>,
): OportunidadeCrm {
  const contato = linha.contato_principal_id ? contatos.get(linha.contato_principal_id) : undefined;
  const evento = eventos.get(linha.id);

  return {
    id: linha.id,
    titulo: linha.titulo,
    etapa: linha.etapa,
    empresaId: linha.empresa_id,
    empresa: empresas.get(linha.empresa_id) ?? 'Empresa não encontrada',
    contatoId: linha.contato_principal_id,
    contato: contato?.nome ?? null,
    contatoEmail: contato?.email ?? null,
    valorCentavos: linha.valor_centavos,
    proximaAcao: linha.proxima_acao,
    proximaAcaoEm: linha.proxima_acao_em,
    ultimoFato: evento?.titulo ?? null,
    ultimoFatoEm: evento?.ocorrido_em ?? null,
    atualizadoEm: linha.atualizado_em,
    criadoEm: linha.criado_em,
  };
}

/** Oportunidade aberta mais recentemente mexida — contexto real para o início. */
export const obterFocoDoCrm = cache(async (): Promise<OportunidadeCrm | null> => {
  const pipeline = await listarPipeline();
  return pipeline.find((item) => item.etapa !== 'ganho' && item.etapa !== 'perdido') ?? null;
});
