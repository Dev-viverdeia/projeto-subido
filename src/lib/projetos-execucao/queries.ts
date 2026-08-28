import 'server-only';

import { cache } from 'react';
import { handleError } from '@/lib/errors';
import { lerDocumentoProposta, type DocumentoProposta } from '@/lib/propostas/schema';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types.generated';
import type { StatusCall } from '@/lib/calls/tipos';
import type { StatusClienteProjeto, StatusProjetoExecucao, StatusTarefaProjeto } from './status';
import {
  lerBriefingKickoff,
  mesclarBriefingComKickoff,
  montarBriefingInicial,
  type BriefingKickoff,
  type OrigemBriefingKickoff,
} from './briefing';

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

export type ArquivoProjetoExecucao = {
  id: string;
  grupoId: string;
  tarefaId: string | null;
  versao: number;
  titulo: string;
  descricao: string | null;
  nomeOriginal: string;
  mimeType: string;
  tamanhoBytes: number;
  visivelCliente: boolean;
  publicadoEm: string | null;
  criadoEm: string;
};

export type AcaoPlanoProjeto = {
  id: string;
  titulo: string;
  prazoEm: string | null;
  status: Tables<'projeto_acoes'>['status'];
  origem: string;
  reuniaoId: string | null;
  concluidaEm: string | null;
  atualizadoEm: string;
};

export type TipoEventoProjeto =
  | 'portal_ativado'
  | 'portal_desativado'
  | 'link_rotacionado'
  | 'aprovacao_solicitada'
  | 'entrega_aprovada'
  | 'ajustes_solicitados'
  | 'arquivo_liberado'
  | 'arquivo_retirado';

export type EventoProjetoExecucao = {
  id: string;
  tarefaId: string | null;
  tipo: TipoEventoProjeto;
  autor: 'prestador' | 'cliente';
  comentario: string | null;
  criadoEm: string;
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
  proximaAcaoPrazoEm: string | null;
  tarefasBloqueadas: number;
  validacoesAguardando: number;
  ajustesSolicitados: number;
};

export type ProjetoExecucaoCompleto = ResumoProjetoExecucao & {
  propostaId: string;
  oportunidadeId: string;
  inicioEm: string;
  documento: DocumentoProposta;
  tarefas: TarefaProjetoExecucao[];
  arquivos: ArquivoProjetoExecucao[];
  acoesPlano: AcaoPlanoProjeto[];
  eventos: EventoProjetoExecucao[];
  portalAtivo: boolean;
  portalCodigo: string;
  portalAtivadoEm: string | null;
  briefing: BriefingKickoff;
  briefingOrigem: OrigemBriefingKickoff;
  kickoff: {
    id: string;
    status: StatusCall;
    agendadaPara: string;
    codigoPublico: string;
  } | null;
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
      'id, titulo, status, prazo_em, atualizado_em, documento, projeto_tarefas(status, titulo, ordem, cliente_status), projeto_acoes(status, titulo, prazo_em, atualizado_em)',
    )
    .eq('projeto_acoes.status', 'pendente')
    .order('atualizado_em', { ascending: false })
    .limit(50);

  if (error) throw handleError(error, 'projetos-execucao:listar');

  return (data ?? []).flatMap((linha) => {
    const documento = lerDocumentoProposta(linha.documento);
    if (!documento) return [];
    const tarefas = [...linha.projeto_tarefas].sort((a, b) => a.ordem - b.ordem);
    const feitas = tarefas.filter((tarefa) => tarefa.status === 'concluida').length;
    const proxima = tarefas.find((tarefa) => tarefa.status !== 'concluida') ?? null;
    const compromisso = [...linha.projeto_acoes]
      .filter((acao) => acao.status === 'pendente')
      .sort((a, b) => {
        if (a.prazo_em && b.prazo_em) return a.prazo_em.localeCompare(b.prazo_em);
        if (a.prazo_em) return -1;
        if (b.prazo_em) return 1;
        return b.atualizado_em.localeCompare(a.atualizado_em);
      })[0];
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
        proximaTarefa: compromisso?.titulo ?? proxima?.titulo ?? null,
        proximaAcaoPrazoEm: compromisso?.prazo_em ?? null,
        tarefasBloqueadas: tarefas.filter((tarefa) => tarefa.status === 'bloqueada').length,
        validacoesAguardando: tarefas.filter((tarefa) => tarefa.cliente_status === 'aguardando')
          .length,
        ajustesSolicitados: tarefas.filter((tarefa) => tarefa.cliente_status === 'ajustes').length,
      },
    ];
  });
});

export const obterProjetoExecucao = cache(
  async (id: string): Promise<ProjetoExecucaoCompleto | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projetos_execucao')
      .select(
        '*, projeto_tarefas(*), projeto_arquivos(*), projeto_acoes(*), projeto_portal_eventos(*)',
      )
      .eq('id', id)
      .maybeSingle();

    if (error) throw handleError(error, 'projetos-execucao:obter');
    if (!data) return null;
    const documento = lerDocumentoProposta(data.documento);
    if (!documento) return null;

    const { data: kickoff, error: erroKickoff } = await supabase
      .from('calls_reunioes')
      .select('id, status, agendada_para, codigo_publico')
      .eq('oportunidade_id', data.oportunidade_id)
      .eq('tipo', 'kickoff')
      .neq('status', 'cancelada')
      .order('agendada_para', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (erroKickoff) throw handleError(erroKickoff, 'projetos-execucao:kickoff');

    const { data: analiseKickoff, error: erroAnaliseKickoff } = kickoff
      ? await supabase
          .from('calls_analises')
          .select('dados, resumo')
          .eq('reuniao_id', kickoff.id)
          .eq('status', 'concluida')
          .maybeSingle()
      : { data: null, error: null };
    if (erroAnaliseKickoff) {
      throw handleError(erroAnaliseKickoff, 'projetos-execucao:briefing-kickoff');
    }

    const briefingSalvo = lerBriefingKickoff(data.briefing_kickoff);
    const briefingDaOrigem = montarBriefingInicial({
      documento,
      dadosAnalise: analiseKickoff?.dados ?? null,
      resumoAnalise: analiseKickoff?.resumo ?? null,
      callId: kickoff?.id ?? null,
    });
    const recebeuNovoKickoff =
      briefingSalvo &&
      briefingDaOrigem.origem === 'kickoff' &&
      !briefingSalvo.confirmadoEm &&
      briefingSalvo.fonteCallId !== briefingDaOrigem.briefing.fonteCallId;
    const briefingPreparado = briefingSalvo
      ? {
          briefing: recebeuNovoKickoff
            ? mesclarBriefingComKickoff(briefingSalvo, briefingDaOrigem.briefing)
            : briefingSalvo,
          origem: recebeuNovoKickoff ? ('kickoff' as const) : ('salvo' as const),
        }
      : briefingDaOrigem;

    const tarefas = data.projeto_tarefas.map(mapearTarefa).sort((a, b) => a.ordem - b.ordem);
    const feitas = tarefas.filter((tarefa) => tarefa.status === 'concluida').length;
    const proxima = tarefas.find((tarefa) => tarefa.status !== 'concluida') ?? null;
    const proximoCompromisso = data.projeto_acoes
      .filter((acao) => acao.status === 'pendente')
      .sort((a, b) => {
        if (a.prazo_em && b.prazo_em) return a.prazo_em.localeCompare(b.prazo_em);
        if (a.prazo_em) return -1;
        if (b.prazo_em) return 1;
        return b.atualizado_em.localeCompare(a.atualizado_em);
      })[0];

    return {
      id: data.id,
      titulo: data.titulo,
      empresa: documento.cliente.empresa,
      status: data.status,
      prazoEm: data.prazo_em,
      atualizadoEm: data.atualizado_em,
      feitas,
      total: tarefas.length,
      proximaTarefa: proximoCompromisso?.titulo ?? proxima?.titulo ?? null,
      proximaAcaoPrazoEm: proximoCompromisso?.prazo_em ?? null,
      tarefasBloqueadas: tarefas.filter((tarefa) => tarefa.status === 'bloqueada').length,
      validacoesAguardando: tarefas.filter((tarefa) => tarefa.clienteStatus === 'aguardando')
        .length,
      ajustesSolicitados: tarefas.filter((tarefa) => tarefa.clienteStatus === 'ajustes').length,
      propostaId: data.proposta_id,
      oportunidadeId: data.oportunidade_id,
      inicioEm: data.inicio_em,
      documento,
      tarefas,
      arquivos: data.projeto_arquivos
        .map((arquivo) => ({
          id: arquivo.id,
          grupoId: arquivo.grupo_id,
          tarefaId: arquivo.tarefa_id,
          versao: arquivo.versao,
          titulo: arquivo.titulo,
          descricao: arquivo.descricao,
          nomeOriginal: arquivo.nome_original,
          mimeType: arquivo.mime_type,
          tamanhoBytes: arquivo.tamanho_bytes,
          visivelCliente: arquivo.visivel_cliente,
          publicadoEm: arquivo.publicado_em,
          criadoEm: arquivo.criado_em,
        }))
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
      portalAtivo: data.portal_ativo,
      portalCodigo: data.portal_codigo,
      portalAtivadoEm: data.portal_ativado_em,
      briefing: briefingPreparado.briefing,
      briefingOrigem: briefingPreparado.origem,
      kickoff: kickoff
        ? {
            id: kickoff.id,
            status: kickoff.status,
            agendadaPara: kickoff.agendada_para,
            codigoPublico: kickoff.codigo_publico,
          }
        : null,
      eventos: data.projeto_portal_eventos
        .flatMap((evento) => {
          const tipo = evento.tipo as TipoEventoProjeto;
          const autor = evento.autor as EventoProjetoExecucao['autor'];
          if (!['prestador', 'cliente'].includes(autor)) return [];
          return [
            {
              id: evento.id,
              tarefaId: evento.tarefa_id,
              tipo,
              autor,
              comentario: evento.comentario,
              criadoEm: evento.criado_em,
            },
          ];
        })
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
      acoesPlano: data.projeto_acoes
        .map((acao) => ({
          id: acao.id,
          titulo: acao.titulo,
          prazoEm: acao.prazo_em,
          status: acao.status,
          origem: acao.origem,
          reuniaoId: acao.reuniao_id,
          concluidaEm: acao.concluida_em,
          atualizadoEm: acao.atualizado_em,
        }))
        .sort((a, b) => {
          if (a.status === 'pendente' && b.status !== 'pendente') return -1;
          if (a.status !== 'pendente' && b.status === 'pendente') return 1;
          if (a.prazoEm && b.prazoEm) return a.prazoEm.localeCompare(b.prazoEm);
          if (a.prazoEm) return -1;
          if (b.prazoEm) return 1;
          return b.atualizadoEm.localeCompare(a.atualizadoEm);
        }),
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
