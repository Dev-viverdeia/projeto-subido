import 'server-only';

import { cache } from 'react';
import { listarOportunidadesComDescobertaConcluida } from '@/lib/calls/descoberta';
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
  compartilhadaEm: string | null;
  ultimaVisualizacaoEm: string | null;
  visualizacoes: number;
  decididaEm: string | null;
};

export type PropostaCompleta = ResumoProposta & {
  empresaId: string;
  oportunidadeId: string;
  projetoId: string | null;
  builderSolucaoId: string | null;
  reuniaoId: string | null;
  documento: DocumentoProposta;
  compartilhamento: {
    codigo: string | null;
    ativo: boolean;
    compartilhadaEm: string | null;
    primeiraVisualizacaoEm: string | null;
    ultimaVisualizacaoEm: string | null;
    visualizacoes: number;
    decisaoNome: string | null;
    decisaoEmail: string | null;
    decisaoComentario: string | null;
    decididaEm: string | null;
  };
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
    .select(
      'id, titulo, status, versao, documento, atualizado_em, criado_em, compartilhada_em, ultima_visualizacao_em, visualizacoes, decidida_em',
    )
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
        compartilhadaEm: linha.compartilhada_em,
        ultimaVisualizacaoEm: linha.ultima_visualizacao_em,
        visualizacoes: linha.visualizacoes,
        decididaEm: linha.decidida_em,
      },
    ];
  });
});

export const obterProposta = cache(async (id: string): Promise<PropostaCompleta | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('propostas')
    .select(
      'id, titulo, status, versao, documento, empresa_id, oportunidade_id, projeto_id, builder_solucao_id, reuniao_id, atualizado_em, criado_em, compartilhamento_codigo, compartilhamento_ativo, compartilhada_em, primeira_visualizacao_em, ultima_visualizacao_em, visualizacoes, decisao_nome, decisao_email, decisao_comentario, decidida_em',
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
    compartilhadaEm: data.compartilhada_em,
    ultimaVisualizacaoEm: data.ultima_visualizacao_em,
    visualizacoes: data.visualizacoes,
    decididaEm: data.decidida_em,
    empresaId: data.empresa_id,
    oportunidadeId: data.oportunidade_id,
    projetoId: data.projeto_id,
    builderSolucaoId: data.builder_solucao_id,
    reuniaoId: data.reuniao_id,
    documento,
    compartilhamento: {
      codigo: data.compartilhamento_codigo,
      ativo: data.compartilhamento_ativo,
      compartilhadaEm: data.compartilhada_em,
      primeiraVisualizacaoEm: data.primeira_visualizacao_em,
      ultimaVisualizacaoEm: data.ultima_visualizacao_em,
      visualizacoes: data.visualizacoes,
      decisaoNome: data.decisao_nome,
      decisaoEmail: data.decisao_email,
      decisaoComentario: data.decisao_comentario,
      decididaEm: data.decidida_em,
    },
  };
});

export async function obterPropostaDaReuniao(
  reuniaoId: string,
): Promise<{ id: string; titulo: string; status: StatusProposta } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('propostas')
    .select('id, titulo, status')
    .eq('reuniao_id', reuniaoId)
    .maybeSingle();

  if (error) throw handleError(error, 'propostas:origem-call');
  return data;
}

export async function listarOpcoesNovaProposta(): Promise<OpcoesNovaProposta> {
  const [oportunidades, projetos, projetosEstudio, descobertas] = await Promise.all([
    listarOportunidadesSeletor(),
    listarSolucoes(),
    listarSolucoesDoBuilder(),
    listarOportunidadesComDescobertaConcluida(),
  ]);

  return {
    oportunidades: oportunidades.filter(
      (item) => item.etapa !== 'ganho' && item.etapa !== 'perdido' && descobertas.has(item.id),
    ),
    projetos: projetos.filter((item) => item.projeto !== null),
    projetosEstudio: projetosEstudio.filter((item) => item.status === 'pronta'),
  };
}
