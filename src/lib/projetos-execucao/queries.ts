import 'server-only';

import { cache } from 'react';
import { handleError } from '@/lib/errors';
import { lerDocumentoProposta, type DocumentoProposta } from '@/lib/propostas/schema';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types.generated';
import type { StatusClienteProjeto, StatusProjetoExecucao, StatusTarefaProjeto } from './status';

export type TarefaProjetoExecucao = {
  id: string;
  faseId: string;
  faseTitulo: string;
  passoId: string;
  titulo: string;
  acao: string;
  concluidoQuando: string;
  entregavel: string;
  ordem: number;
  status: StatusTarefaProjeto;
  evidencia: string | null;
  evidenciaEm: string | null;
  concluidaEm: string | null;
  clienteStatus: StatusClienteProjeto;
  clienteNota: string | null;
  entregavelUrl: string | null;
  clienteSolicitadoEm: string | null;
  clienteRespondidoEm: string | null;
  clienteComentario: string | null;
};

export type ResumoProjetoExecucao = {
  id: string;
  titulo: string;
  empresa: string;
  status: StatusProjetoExecucao;
  prazoEm: string | null;
  atualizadoEm: string;
  feitas: number;
  total: number;
  proximaTarefa: string | null;
};

export type ProjetoExecucaoCompleto = ResumoProjetoExecucao & {
  propostaId: string;
  oportunidadeId: string;
  inicioEm: string;
  documento: DocumentoProposta;
  tarefas: TarefaProjetoExecucao[];
  portalAtivo: boolean;
  portalCodigo: string;
  portalAtivadoEm: string | null;
};

type LinhaTarefa = Tables<'projeto_tarefas'>;

function mapearTarefa(linha: LinhaTarefa): TarefaProjetoExecucao {
  return {
    id: linha.id,
    faseId: linha.fase_id,
    faseTitulo: linha.fase_titulo,
    passoId: linha.passo_id,
    titulo: linha.titulo,
    acao: linha.acao,
    concluidoQuando: linha.concluido_quando,
    entregavel: linha.entregavel,
    ordem: linha.ordem,
    status: linha.status,
    evidencia: linha.evidencia,
    evidenciaEm: linha.evidencia_em,
    concluidaEm: linha.concluida_em,
    clienteStatus: linha.cliente_status,
    clienteNota: linha.cliente_nota,
    entregavelUrl: linha.entregavel_url,
    clienteSolicitadoEm: linha.cliente_solicitado_em,
    clienteRespondidoEm: linha.cliente_respondido_em,
    clienteComentario: linha.cliente_comentario,
  };
}

export const listarProjetosExecucao = cache(async (): Promise<ResumoProjetoExecucao[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projetos_execucao')
    .select(
      'id, titulo, status, prazo_em, atualizado_em, documento, projeto_tarefas(status, titulo, ordem)',
    )
    .order('atualizado_em', { ascending: false })
    .limit(50);

  if (error) throw handleError(error, 'projetos-execucao:listar');

  return (data ?? []).flatMap((linha) => {
    const documento = lerDocumentoProposta(linha.documento);
    if (!documento) return [];
    const tarefas = [...linha.projeto_tarefas].sort((a, b) => a.ordem - b.ordem);
    const feitas = tarefas.filter((tarefa) => tarefa.status === 'concluida').length;
    const proxima = tarefas.find((tarefa) => tarefa.status !== 'concluida') ?? null;
    return [
      {
        id: linha.id,
        titulo: linha.titulo,
        empresa: documento.cliente.empresa,
        status: linha.status,
        prazoEm: linha.prazo_em,
        atualizadoEm: linha.atualizado_em,
        feitas,
        total: tarefas.length,
        proximaTarefa: proxima?.titulo ?? null,
      },
    ];
  });
});

export const obterProjetoExecucao = cache(
  async (id: string): Promise<ProjetoExecucaoCompleto | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projetos_execucao')
      .select('*, projeto_tarefas(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw handleError(error, 'projetos-execucao:obter');
    if (!data) return null;
    const documento = lerDocumentoProposta(data.documento);
    if (!documento) return null;

    const tarefas = data.projeto_tarefas.map(mapearTarefa).sort((a, b) => a.ordem - b.ordem);
    const feitas = tarefas.filter((tarefa) => tarefa.status === 'concluida').length;
    const proxima = tarefas.find((tarefa) => tarefa.status !== 'concluida') ?? null;

    return {
      id: data.id,
      titulo: data.titulo,
      empresa: documento.cliente.empresa,
      status: data.status,
      prazoEm: data.prazo_em,
      atualizadoEm: data.atualizado_em,
      feitas,
      total: tarefas.length,
      proximaTarefa: proxima?.titulo ?? null,
      propostaId: data.proposta_id,
      oportunidadeId: data.oportunidade_id,
      inicioEm: data.inicio_em,
      documento,
      tarefas,
      portalAtivo: data.portal_ativo,
      portalCodigo: data.portal_codigo,
      portalAtivadoEm: data.portal_ativado_em,
    };
  },
);

export const obterExecucaoDaProposta = cache(async (propostaId: string): Promise<string | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projetos_execucao')
    .select('id')
    .eq('proposta_id', propostaId)
    .maybeSingle();

  if (error) throw handleError(error, 'projetos-execucao:por-proposta');
  return data?.id ?? null;
});
