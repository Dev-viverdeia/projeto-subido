import 'server-only';

import { cache } from 'react';
import { handleError } from '@/lib/errors';
import { lerDocumentoProposta, type DocumentoProposta } from '@/lib/propostas/schema';
import { lerRoteiroProjeto, type RoteiroProjeto } from '@/lib/projetos/roteiro';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types.generated';
import type { StatusCall } from '@/lib/calls/tipos';
import type { StatusEmailEntrega } from '@/lib/notificacoes/entrega';
import type { StatusClienteProjeto, StatusProjetoExecucao, StatusTarefaProjeto } from './status';
import {
  lerBriefingKickoff,
  mesclarBriefingComKickoff,
  montarBriefingInicial,
  type BriefingKickoff,
  type OrigemBriefingKickoff,
} from './briefing';
import { montarKitOperacionalTarefa, type KitOperacionalTarefa } from './kit-operacional';
import {
  mapearAcoesPlano,
  obterProximoCompromisso,
  resumirDependencias,
  type AcaoPlanoProjeto,
} from './plano';

export type { AcaoPlanoProjeto } from './plano';

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
  kitOperacional?: KitOperacionalTarefa | null;
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

export type TipoEventoProjeto =
  | 'portal_ativado'
  | 'portal_desativado'
  | 'link_rotacionado'
  | 'aprovacao_solicitada'
  | 'entrega_aprovada'
  | 'ajustes_solicitados'
  | 'arquivo_liberado'
  | 'arquivo_retirado'
  | 'pendencia_concluida';

export type EventoProjetoExecucao = {
  id: string;
  tarefaId: string | null;
  tipo: TipoEventoProjeto;
  autor: 'prestador' | 'cliente';
  comentario: string | null;
  criadoEm: string;
  emailDestinatario?: string | null;
  emailStatus?: StatusEmailEntrega;
  emailTentativas?: number;
  emailEnviadoEm?: string | null;
  emailEntregueEm?: string | null;
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
  dependenciasClientePendentes?: number;
  dependenciasPrestadorPendentes?: number;
  dependenciasClienteAtrasadas?: number;
  dependenciasPrestadorAtrasadas?: number;
};

export type ProjetoExecucaoCompleto = ResumoProjetoExecucao & {
  propostaId: string;
  oportunidadeId: string;
  inicioEm: string;
  aceiteVenda: {
    versao: number;
    aceitoEm: string;
    aceitoPor: string | null;
  };
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

function mapearTarefa(
  linha: LinhaTarefa,
  guia: { projetoSlug: string; roteiro: RoteiroProjeto } | null = null,
): TarefaProjetoExecucao {
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
    kitOperacional: guia
      ? montarKitOperacionalTarefa({
          projetoSlug: guia.projetoSlug,
          roteiro: guia.roteiro,
          faseId: linha.fase_id,
          passoId: linha.passo_id,
        })
      : null,
  };
}

export const listarProjetosExecucao = cache(async (): Promise<ResumoProjetoExecucao[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projetos_execucao')
    .select(
      'id, titulo, status, prazo_em, atualizado_em, documento, projeto_tarefas(status, titulo, ordem, cliente_status), projeto_acoes(*)',
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
    const acoesPlano = mapearAcoesPlano(linha.projeto_acoes);
    const compromisso = obterProximoCompromisso(acoesPlano);
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
        proximaAcaoPrazoEm: compromisso?.prazoEm ?? null,
        tarefasBloqueadas: tarefas.filter((tarefa) => tarefa.status === 'bloqueada').length,
        validacoesAguardando: tarefas.filter((tarefa) => tarefa.cliente_status === 'aguardando')
          .length,
        ajustesSolicitados: tarefas.filter((tarefa) => tarefa.cliente_status === 'ajustes').length,
        ...resumirDependencias(acoesPlano),
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

    const consultarGuia = async () => {
      if (!data.projeto_id) return { data: null, error: null };
      return await supabase
        .from('solucoes')
        .select('slug, projeto_roteiros(roteiro)')
        .eq('id', data.projeto_id)
        .maybeSingle();
    };

    const [resultadoKickoff, resultadoAceite, resultadoGuia] = await Promise.all([
      supabase
        .from('calls_reunioes')
        .select('id, status, agendada_para, codigo_publico')
        .eq('oportunidade_id', data.oportunidade_id)
        .eq('tipo', 'kickoff')
        .neq('status', 'cancelada')
        .order('agendada_para', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('propostas')
        .select('versao, aceita_em, decisao_nome')
        .eq('id', data.proposta_id)
        .maybeSingle(),
      consultarGuia(),
    ]);
    const { data: kickoff, error: erroKickoff } = resultadoKickoff;
    const { data: aceite, error: erroAceite } = resultadoAceite;
    const { data: conteudoProjeto, error: erroGuia } = resultadoGuia;

    if (erroKickoff) throw handleError(erroKickoff, 'projetos-execucao:kickoff');
    if (erroAceite) throw handleError(erroAceite, 'projetos-execucao:aceite-venda');
    if (erroGuia) throw handleError(erroGuia, 'projetos-execucao:guia-operacional');

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

    const roteiro = conteudoProjeto?.projeto_roteiros
      ? lerRoteiroProjeto(conteudoProjeto.projeto_roteiros.roteiro)
      : null;
    const guia =
      conteudoProjeto?.slug && roteiro ? { projetoSlug: conteudoProjeto.slug, roteiro } : null;
    const tarefas = data.projeto_tarefas
      .map((tarefa) => mapearTarefa(tarefa, guia))
      .sort((a, b) => a.ordem - b.ordem);
    const feitas = tarefas.filter((tarefa) => tarefa.status === 'concluida').length;
    const proxima = tarefas.find((tarefa) => tarefa.status !== 'concluida') ?? null;
    const acoesPlano = mapearAcoesPlano(data.projeto_acoes);
    const proximoCompromisso = obterProximoCompromisso(acoesPlano);

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
      proximaAcaoPrazoEm: proximoCompromisso?.prazoEm ?? null,
      tarefasBloqueadas: tarefas.filter((tarefa) => tarefa.status === 'bloqueada').length,
      validacoesAguardando: tarefas.filter((tarefa) => tarefa.clienteStatus === 'aguardando')
        .length,
      ajustesSolicitados: tarefas.filter((tarefa) => tarefa.clienteStatus === 'ajustes').length,
      ...resumirDependencias(acoesPlano),
      propostaId: data.proposta_id,
      oportunidadeId: data.oportunidade_id,
      inicioEm: data.inicio_em,
      aceiteVenda: {
        versao: aceite?.versao ?? 1,
        aceitoEm: aceite?.aceita_em ?? data.inicio_em,
        aceitoPor: aceite?.decisao_nome ?? documento.cliente.contato,
      },
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
              emailDestinatario: evento.email_destinatario,
              emailStatus: evento.email_status as StatusEmailEntrega,
              emailTentativas: evento.email_tentativas,
              emailEnviadoEm: evento.email_enviado_em,
              emailEntregueEm: evento.email_entregue_em,
            },
          ];
        })
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
      acoesPlano,
    };
  },
);
