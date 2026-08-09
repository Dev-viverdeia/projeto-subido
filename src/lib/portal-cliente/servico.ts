import 'server-only';

import { cache } from 'react';
import { handleError } from '@/lib/errors';
import { lerDocumentoProposta } from '@/lib/propostas/schema';
import type {
  StatusClienteProjeto,
  StatusProjetoExecucao,
  StatusTarefaProjeto,
} from '@/lib/projetos-execucao/status';
// Exceção deliberada: o link secreto é resolvido no servidor sem abrir SELECT
// para `anon`. O retorno abaixo contém só o recorte preparado para o cliente.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';

export type TarefaPortalCliente = {
  id: string;
  faseId: string;
  faseTitulo: string;
  titulo: string;
  entregavel: string;
  ordem: number;
  status: StatusTarefaProjeto;
  clienteStatus: StatusClienteProjeto;
  clienteNota: string | null;
  entregavelUrl: string | null;
  solicitadoEm: string | null;
  respondidoEm: string | null;
  comentario: string | null;
};

export type ArquivoPortalCliente = {
  id: string;
  tarefaId: string | null;
  titulo: string;
  descricao: string | null;
  nomeOriginal: string;
  mimeType: string;
  tamanhoBytes: number;
  versao: number;
  publicadoEm: string;
};

export type ProjetoPortalCliente = {
  id: string;
  titulo: string;
  empresa: string;
  resumo: string;
  objetivo: string;
  status: StatusProjetoExecucao;
  inicioEm: string;
  prazoEm: string | null;
  feitas: number;
  total: number;
  tarefas: TarefaPortalCliente[];
  arquivos: ArquivoPortalCliente[];
};

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
        'id, titulo, status, inicio_em, prazo_em, documento, projeto_tarefas(id, fase_id, fase_titulo, titulo, entregavel, ordem, status, cliente_status, cliente_nota, entregavel_url, cliente_solicitado_em, cliente_respondido_em, cliente_comentario)',
      )
      .eq('portal_codigo', codigo)
      .eq('portal_ativo', true)
      .maybeSingle();

    if (error) throw handleError(error, 'portal-cliente:obter');
    if (!data) return null;
    const documento = lerDocumentoProposta(data.documento);
    if (!documento) return null;

    const tarefas = [...data.projeto_tarefas]
      .sort((a, b) => a.ordem - b.ordem)
      .map((tarefa) => ({
        id: tarefa.id,
        faseId: tarefa.fase_id,
        faseTitulo: tarefa.fase_titulo,
        titulo: tarefa.titulo,
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
    };
  },
);

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
}): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('projeto_portal_decidir', {
    p_codigo: codigo,
    p_tarefa_id: tarefaId,
    p_decisao: decisao,
    p_comentario: comentario ?? undefined,
  });

  if (error) throw handleError(error, 'portal-cliente:decidir');
  return data;
}
