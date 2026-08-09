import 'server-only';

import { cache } from 'react';
import { listarSolucoes, type SolucaoResumo } from '@/lib/conteudo/queries';
import { listarOportunidadesSeletor, type OportunidadeSeletor } from '@/lib/crm/queries';
import { listarSolucoesDoBuilder, type ItemHistorico } from '@/lib/builder/queries';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import type { Enums } from '@/lib/supabase/types.generated';
import { lerDocumentoProposta, type DocumentoProposta } from './schema';

export type StatusProposta = Enums<'proposta_status'>;

export type ResumoProposta = {
  id: string;
  titulo: string;
  status: StatusProposta;
  versao: number;
  atualizadoEm: string;
  criadoEm: string;
  empresa: string;
  projeto: string;
  valorCentavos: number | null;
};

export type PropostaCompleta = ResumoProposta & {
  empresaId: string;
  oportunidadeId: string;
  projetoId: string | null;
  builderSolucaoId: string | null;
  documento: DocumentoProposta;
};

export type OpcoesNovaProposta = {
  oportunidades: OportunidadeSeletor[];
  projetos: SolucaoResumo[];
  projetosEstudio: ItemHistorico[];
};

export const listarPropostas = cache(async (): Promise<ResumoProposta[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('propostas')
    .select('id, titulo, status, versao, documento, atualizado_em, criado_em')
    .order('atualizado_em', { ascending: false })
    .limit(100);

  if (error) throw handleError(error, 'propostas:listar');

  return (data ?? []).flatMap((linha) => {
    const documento = lerDocumentoProposta(linha.documento);
    if (!documento) return [];
    return [
      {
        id: linha.id,
        titulo: linha.titulo,
        status: linha.status,
        versao: linha.versao,
        atualizadoEm: linha.atualizado_em,
        criadoEm: linha.criado_em,
        empresa: documento.cliente.empresa,
        projeto: documento.projeto.titulo,
        valorCentavos: documento.investimento.valorCentavos,
      },
    ];
  });
});

export const obterProposta = cache(async (id: string): Promise<PropostaCompleta | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('propostas')
    .select(
      'id, titulo, status, versao, documento, empresa_id, oportunidade_id, projeto_id, builder_solucao_id, atualizado_em, criado_em',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw handleError(error, 'propostas:obter');
  if (!data) return null;
  const documento = lerDocumentoProposta(data.documento);
  if (!documento) return null;

  return {
    id: data.id,
    titulo: data.titulo,
    status: data.status,
    versao: data.versao,
    atualizadoEm: data.atualizado_em,
    criadoEm: data.criado_em,
    empresa: documento.cliente.empresa,
    projeto: documento.projeto.titulo,
    valorCentavos: documento.investimento.valorCentavos,
    empresaId: data.empresa_id,
    oportunidadeId: data.oportunidade_id,
    projetoId: data.projeto_id,
    builderSolucaoId: data.builder_solucao_id,
    documento,
  };
});

export async function listarOpcoesNovaProposta(): Promise<OpcoesNovaProposta> {
  const [oportunidades, projetos, projetosEstudio] = await Promise.all([
    listarOportunidadesSeletor(),
    listarSolucoes(),
    listarSolucoesDoBuilder(),
  ]);

  return {
    oportunidades: oportunidades.filter(
      (item) => item.etapa !== 'ganho' && item.etapa !== 'perdido',
    ),
    projetos: projetos.filter((item) => item.projeto !== null),
    projetosEstudio: projetosEstudio.filter((item) => item.status === 'pronta'),
  };
}
