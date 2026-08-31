import 'server-only';

import { env } from '@/lib/env';
import { handleError } from '@/lib/errors';
import {
  enviarNotificacaoEntrega,
  marcarNotificacaoSemDestinatario,
} from '@/lib/notificacoes/entrega';
import {
  emailDecisaoMudancaEscopo,
  emailMudancaEscopoSolicitada,
} from '@/lib/notificacoes/entrega-email';
import { lerDocumentoProposta } from '@/lib/propostas/schema';
// Exceção deliberada: o link secreto do portal é validado no servidor.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';

type ResultadoMudanca = {
  notificacao: 'enviada' | 'falhou' | 'indisponivel' | null;
};

export async function registrarSolicitacaoMudancaEscopo({
  codigo,
  titulo,
  descricao,
}: {
  codigo: string;
  titulo: string;
  descricao: string;
}): Promise<ResultadoMudanca & { solicitou: boolean }> {
  const admin = createAdminClient();
  const { data: projeto, error: erroProjeto } = await admin
    .from('projetos_execucao')
    .select('id, dono, titulo, documento')
    .eq('portal_codigo', codigo)
    .eq('portal_ativo', true)
    .maybeSingle();
  if (erroProjeto) throw handleError(erroProjeto, 'portal-cliente:contexto-mudanca');
  if (!projeto) return { solicitou: false, notificacao: null };

  const { data: mudancaId, error } = await admin.rpc('projeto_portal_solicitar_mudanca_escopo', {
    p_codigo: codigo,
    p_titulo: titulo,
    p_descricao: descricao,
  });
  if (error) throw handleError(error, 'portal-cliente:solicitar-mudanca');
  if (!mudancaId) return { solicitou: false, notificacao: null };

  const { data: evento, error: erroEvento } = await admin
    .from('projeto_portal_eventos')
    .select('id')
    .eq('mudanca_escopo_id', mudancaId)
    .eq('tipo', 'mudanca_escopo_solicitada')
    .maybeSingle();
  if (erroEvento || !evento) return { solicitou: true, notificacao: 'indisponivel' };

  const [{ data: dono, error: erroDono }, documento] = await Promise.all([
    admin.auth.admin.getUserById(projeto.dono),
    Promise.resolve(lerDocumentoProposta(projeto.documento)),
  ]);
  const destinatario = dono.user?.email ?? documento?.fornecedor?.email ?? null;
  if (erroDono || !destinatario || !documento) {
    await marcarNotificacaoSemDestinatario(evento.id);
    return { solicitou: true, notificacao: 'indisponivel' };
  }

  const notificacao = await enviarNotificacaoEntrega({
    eventoId: evento.id,
    destinatario,
    responderPara: documento.cliente.email,
    conteudo: emailMudancaEscopoSolicitada({
      empresa: documento.cliente.empresa,
      projeto: projeto.titulo,
      tituloMudanca: titulo,
      descricao,
      link: `${env.NEXT_PUBLIC_SITE_URL}/entregas/${projeto.id}`,
    }),
  });

  return {
    solicitou: true,
    notificacao: notificacao.status === 'falhou' ? 'falhou' : 'enviada',
  };
}

export async function registrarDecisaoMudancaEscopo({
  codigo,
  mudancaId,
  decisao,
}: {
  codigo: string;
  mudancaId: string;
  decisao: 'aprovada' | 'recusada';
}): Promise<ResultadoMudanca & { decidiu: boolean }> {
  const admin = createAdminClient();
  const { data: projeto, error: erroProjeto } = await admin
    .from('projetos_execucao')
    .select('id, dono, titulo, documento')
    .eq('portal_codigo', codigo)
    .eq('portal_ativo', true)
    .maybeSingle();
  if (erroProjeto) throw handleError(erroProjeto, 'portal-cliente:contexto-decisao-mudanca');
  if (!projeto) return { decidiu: false, notificacao: null };

  const { data: mudanca, error: erroMudanca } = await admin
    .from('projeto_mudancas_escopo')
    .select('id, titulo')
    .eq('id', mudancaId)
    .eq('projeto_execucao_id', projeto.id)
    .eq('status', 'aguardando_cliente')
    .maybeSingle();
  if (erroMudanca) throw handleError(erroMudanca, 'portal-cliente:mudanca-decisao');
  if (!mudanca) return { decidiu: false, notificacao: null };

  const { data: eventoId, error } = await admin.rpc('projeto_portal_decidir_mudanca_escopo', {
    p_codigo: codigo,
    p_mudanca_id: mudanca.id,
    p_decisao: decisao,
  });
  if (error) throw handleError(error, 'portal-cliente:decidir-mudanca');
  if (!eventoId) return { decidiu: false, notificacao: null };

  const [{ data: dono, error: erroDono }, documento] = await Promise.all([
    admin.auth.admin.getUserById(projeto.dono),
    Promise.resolve(lerDocumentoProposta(projeto.documento)),
  ]);
  const destinatario = dono.user?.email ?? documento?.fornecedor?.email ?? null;
  if (erroDono || !destinatario || !documento) {
    await marcarNotificacaoSemDestinatario(eventoId);
    return { decidiu: true, notificacao: 'indisponivel' };
  }

  const notificacao = await enviarNotificacaoEntrega({
    eventoId,
    destinatario,
    responderPara: documento.cliente.email,
    conteudo: emailDecisaoMudancaEscopo({
      empresa: documento.cliente.empresa,
      projeto: projeto.titulo,
      tituloMudanca: mudanca.titulo,
      decisao,
      link: `${env.NEXT_PUBLIC_SITE_URL}/entregas/${projeto.id}`,
    }),
  });

  return {
    decidiu: true,
    notificacao: notificacao.status === 'falhou' ? 'falhou' : 'enviada',
  };
}
