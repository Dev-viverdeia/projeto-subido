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
