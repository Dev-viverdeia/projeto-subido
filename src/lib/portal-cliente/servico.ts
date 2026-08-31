import 'server-only';

import { cache } from 'react';
import { env } from '@/lib/env';
import { handleError } from '@/lib/errors';
import {
  enviarNotificacaoEntrega,
  marcarNotificacaoSemDestinatario,
} from '@/lib/notificacoes/entrega';
import { emailDecisaoCliente, emailPendenciaResolvida } from '@/lib/notificacoes/entrega-email';
import { lerDocumentoProposta } from '@/lib/propostas/schema';
import { mapearMudancasEscopo } from '@/lib/projetos-execucao/mudancas-escopo';
import { lerBriefingKickoff } from '@/lib/projetos-execucao/briefing';
import { obterEncerramentoUnico } from '@/lib/projetos-execucao/encerramento';
import { obterEvolucaoUnica } from '@/lib/projetos-execucao/evolucao';
// Exceção deliberada: o link secreto é resolvido no servidor sem abrir SELECT
// para `anon`. O retorno abaixo contém só o recorte preparado para o cliente.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import { EVENTOS_VISIVEIS_PORTAL } from './eventos';
import type { AcaoPortalCliente, EventoPortalCliente, ProjetoPortalCliente } from './tipos';

export type {
  AcaoPortalCliente,
  ArquivoPortalCliente,
  EventoPortalCliente,
  ProjetoPortalCliente,
  TarefaPortalCliente,
} from './tipos';

function codigoValido(codigo: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(codigo);
}

export const obterPortalCliente = cache(
  async (codigo: string): Promise<ProjetoPortalCliente | null> => {
    if (!codigoValido(codigo)) return null;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('projetos_execucao')
      .select(
        'id, titulo, status, inicio_em, prazo_em, documento, briefing_kickoff, projeto_tarefas(id, fase_id, fase_titulo, titulo, concluido_quando, entregavel, ordem, status, cliente_status, cliente_nota, entregavel_url, cliente_solicitado_em, cliente_respondido_em, cliente_comentario), projeto_acoes(id, titulo, categoria, prazo_em, status, responsavel_nome, responsavel_tipo, visivel_cliente), projeto_mudancas_escopo(*), projeto_encerramentos(*), projeto_evolucoes(*)',
      )
      .eq('portal_codigo', codigo)
      .eq('portal_ativo', true)
      .maybeSingle();

    if (error) throw handleError(error, 'portal-cliente:obter');
    if (!data) return null;
    const documento = lerDocumentoProposta(data.documento);
    if (!documento) return null;
    const briefing = lerBriefingKickoff(data.briefing_kickoff);

    const tarefas = [...data.projeto_tarefas]
      .sort((a, b) => a.ordem - b.ordem)
      .map((tarefa) => ({
        id: tarefa.id,
        faseId: tarefa.fase_id,
        faseTitulo: tarefa.fase_titulo,
        titulo: tarefa.titulo,
        concluidoQuando: tarefa.concluido_quando,
        entregavel: tarefa.entregavel,
        ordem: tarefa.ordem,
        status: tarefa.status,
        clienteStatus: tarefa.cliente_status,
        clienteNota: tarefa.cliente_nota,
        entregavelUrl: tarefa.entregavel_url,
        solicitadoEm: tarefa.cliente_solicitado_em,
        respondidoEm: tarefa.cliente_respondido_em,
        comentario: tarefa.cliente_comentario,
      }));

    const { data: arquivos, error: erroArquivos } = await admin
      .from('projeto_arquivos')
      .select(
        'id, tarefa_id, titulo, descricao, nome_original, mime_type, tamanho_bytes, versao, publicado_em',
      )
      .eq('projeto_execucao_id', data.id)
      .eq('visivel_cliente', true)
      .order('publicado_em', { ascending: false });
    if (erroArquivos) throw handleError(erroArquivos, 'portal-cliente:arquivos');

    const { data: eventos, error: erroEventos } = await admin
      .from('projeto_portal_eventos')
      .select('id, tarefa_id, mudanca_escopo_id, tipo, autor, comentario, criado_em')
      .eq('projeto_execucao_id', data.id)
      .in('tipo', [...EVENTOS_VISIVEIS_PORTAL])
      .order('criado_em', { ascending: false })
      .limit(40);
    if (erroEventos) throw handleError(erroEventos, 'portal-cliente:eventos');

    return {
      id: data.id,
      titulo: data.titulo,
      empresa: documento.cliente.empresa,
      resumo: documento.projeto.resumo,
      objetivo: documento.objetivo,
      status: data.status,
      inicioEm: data.inicio_em,
      prazoEm: data.prazo_em,
      feitas: tarefas.filter((tarefa) => tarefa.status === 'concluida').length,
      total: tarefas.length,
      tarefas,
      arquivos: (arquivos ?? []).flatMap((arquivo) =>
        arquivo.publicado_em
          ? [
              {
                id: arquivo.id,
                tarefaId: arquivo.tarefa_id,
                titulo: arquivo.titulo,
                descricao: arquivo.descricao,
                nomeOriginal: arquivo.nome_original,
                mimeType: arquivo.mime_type,
                tamanhoBytes: arquivo.tamanho_bytes,
                versao: arquivo.versao,
                publicadoEm: arquivo.publicado_em,
              },
            ]
          : [],
      ),
      eventos: (eventos ?? []).flatMap((evento) => {
        if (
          !EVENTOS_VISIVEIS_PORTAL.includes(
            evento.tipo as (typeof EVENTOS_VISIVEIS_PORTAL)[number],
          ) ||
          !['prestador', 'cliente'].includes(evento.autor)
        ) {
          return [];
        }
        return [
          {
            id: evento.id,
            tarefaId: evento.tarefa_id,
            mudancaEscopoId: evento.mudanca_escopo_id,
            tipo: evento.tipo as EventoPortalCliente['tipo'],
            autor: evento.autor as EventoPortalCliente['autor'],
            comentario: evento.comentario,
            criadoEm: evento.criado_em,
          },
        ];
      }),
      mudancasEscopo: mapearMudancasEscopo(data.projeto_mudancas_escopo),
      dependencias: data.projeto_acoes
        .filter(
          (acao) =>
            acao.visivel_cliente &&
            acao.responsavel_tipo === 'cliente' &&
            ['acesso', 'dependencia'].includes(acao.categoria) &&
            ['pendente', 'concluida'].includes(acao.status),
        )
        .map((acao) => ({
          id: acao.id,
          titulo: acao.titulo,
          categoria: acao.categoria as AcaoPortalCliente['categoria'],
          prazoEm: acao.prazo_em,
          status: acao.status as AcaoPortalCliente['status'],
          responsavelNome: acao.responsavel_nome,
        }))
        .sort((a, b) => {
          if (a.status === 'pendente' && b.status !== 'pendente') return -1;
          if (a.status !== 'pendente' && b.status === 'pendente') return 1;
          if (a.prazoEm && b.prazoEm) return a.prazoEm.localeCompare(b.prazoEm);
          if (a.prazoEm) return -1;
          if (b.prazoEm) return 1;
          return a.titulo.localeCompare(b.titulo, 'pt-BR');
        }),
      briefing: briefing?.confirmadoEm
        ? {
            objetivo: briefing.objetivo,
            criterioSucesso: briefing.criterioSucesso,
            responsavelCliente: briefing.responsavelCliente,
            responsavelTecnico: briefing.responsavelTecnico,
            proximosPassos: briefing.proximosPassos,
          }
        : null,
      encerramento: obterEncerramentoUnico(data.projeto_encerramentos),
      evolucao: obterEvolucaoUnica(data.projeto_evolucoes),
    };
  },
);

export async function registrarConclusaoDependenciaCliente({
  codigo,
  acaoId,
}: {
  codigo: string;
  acaoId: string;
}): Promise<{
  concluiu: boolean;
  notificacao: 'enviada' | 'falhou' | 'indisponivel' | null;
}> {
  const admin = createAdminClient();
  const { data: projeto, error: erroProjeto } = await admin
    .from('projetos_execucao')
    .select('id, dono, titulo, documento')
    .eq('portal_codigo', codigo)
    .eq('portal_ativo', true)
    .maybeSingle();
  if (erroProjeto) throw handleError(erroProjeto, 'portal-cliente:contexto-pendencia');
  if (!projeto) return { concluiu: false, notificacao: null };

  const { data: acao, error: erroAcao } = await admin
    .from('projeto_acoes')
    .select('titulo')
    .eq('id', acaoId)
    .eq('projeto_execucao_id', projeto.id)
    .eq('responsavel_tipo', 'cliente')
    .eq('visivel_cliente', true)
    .maybeSingle();
  if (erroAcao) throw handleError(erroAcao, 'portal-cliente:item-pendencia');
  if (!acao) return { concluiu: false, notificacao: null };

  const { data, error } = await admin.rpc('projeto_portal_concluir_pendencia', {
    p_codigo: codigo,
    p_acao: acaoId,
  });
  if (error) throw handleError(error, 'portal-cliente:concluir-pendencia');
  if (!data) return { concluiu: false, notificacao: null };

  const { data: evento, error: erroEvento } = await admin
    .from('projeto_portal_eventos')
    .select('id')
    .eq('projeto_execucao_id', projeto.id)
    .eq('acao_id', acaoId)
    .eq('tipo', 'pendencia_concluida')
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (erroEvento || !evento) {
    console.error(
      `[portal-cliente:notificacao-pendencia] ${erroEvento?.code ?? 'sem-evento'}: ${erroEvento?.message ?? ''}`,
    );
    return { concluiu: true, notificacao: 'indisponivel' };
  }

  const [{ data: dono, error: erroDono }, documento] = await Promise.all([
    admin.auth.admin.getUserById(projeto.dono),
    Promise.resolve(lerDocumentoProposta(projeto.documento)),
  ]);
  const destinatario = dono.user?.email ?? documento?.fornecedor?.email ?? null;
  if (erroDono || !destinatario || !documento) {
    await marcarNotificacaoSemDestinatario(evento.id);
    return { concluiu: true, notificacao: 'indisponivel' };
  }

  const notificacao = await enviarNotificacaoEntrega({
    eventoId: evento.id,
    destinatario,
    conteudo: emailPendenciaResolvida({
      empresa: documento.cliente.empresa,
      projeto: projeto.titulo,
      tarefa: acao.titulo,
      link: `${env.NEXT_PUBLIC_SITE_URL}/entregas/${projeto.id}`,
    }),
  });

  return {
    concluiu: true,
    notificacao: notificacao.status === 'falhou' ? 'falhou' : 'enviada',
  };
}

export async function registrarDecisaoCliente({
  codigo,
  tarefaId,
  decisao,
  comentario,
}: {
  codigo: string;
  tarefaId: string;
  decisao: 'aprovada' | 'ajustes';
  comentario: string | null;
}): Promise<{
  decidiu: boolean;
  notificacao: 'enviada' | 'falhou' | 'indisponivel' | null;
}> {
  const admin = createAdminClient();
  const { data: projeto, error: erroProjeto } = await admin
    .from('projetos_execucao')
    .select('id, dono, titulo, documento')
    .eq('portal_codigo', codigo)
    .eq('portal_ativo', true)
    .maybeSingle();
  if (erroProjeto) throw handleError(erroProjeto, 'portal-cliente:contexto-decisao');
  if (!projeto) return { decidiu: false, notificacao: null };

  const { data: tarefa, error: erroTarefa } = await admin
    .from('projeto_tarefas')
    .select('titulo')
    .eq('id', tarefaId)
    .eq('projeto_execucao_id', projeto.id)
    .maybeSingle();
  if (erroTarefa) throw handleError(erroTarefa, 'portal-cliente:tarefa-decisao');
  if (!tarefa) return { decidiu: false, notificacao: null };

  const { data, error } = await admin.rpc('projeto_portal_decidir', {
    p_codigo: codigo,
    p_tarefa_id: tarefaId,
    p_decisao: decisao,
    p_comentario: comentario ?? undefined,
  });

  if (error) throw handleError(error, 'portal-cliente:decidir');
  if (!data) return { decidiu: false, notificacao: null };

  const tipo = decisao === 'aprovada' ? 'entrega_aprovada' : 'ajustes_solicitados';
  const { data: evento, error: erroEvento } = await admin
    .from('projeto_portal_eventos')
    .select('id')
    .eq('projeto_execucao_id', projeto.id)
    .eq('tarefa_id', tarefaId)
    .eq('tipo', tipo)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (erroEvento || !evento) {
    console.error(
      `[portal-cliente:notificacao-evento] ${erroEvento?.code ?? 'sem-evento'}: ${erroEvento?.message ?? ''}`,
    );
    return { decidiu: true, notificacao: 'indisponivel' };
  }

  const [{ data: dono, error: erroDono }, documento] = await Promise.all([
    admin.auth.admin.getUserById(projeto.dono),
    Promise.resolve(lerDocumentoProposta(projeto.documento)),
  ]);
  const destinatario = dono.user?.email ?? documento?.fornecedor?.email ?? null;
  if (erroDono || !destinatario || !documento) {
    await marcarNotificacaoSemDestinatario(evento.id);
    return { decidiu: true, notificacao: 'indisponivel' };
  }

  const notificacao = await enviarNotificacaoEntrega({
    eventoId: evento.id,
    destinatario,
    conteudo: emailDecisaoCliente({
      empresa: documento.cliente.empresa,
      projeto: projeto.titulo,
      tarefa: tarefa.titulo,
      decisao,
      comentario,
      link: `${env.NEXT_PUBLIC_SITE_URL}/entregas/${projeto.id}`,
    }),
  });

  return {
    decidiu: true,
    notificacao: notificacao.status === 'falhou' ? 'falhou' : 'enviada',
  };
}
