import { z } from 'zod';
import { obterAcessoRecurso } from '@/lib/planos/server';
import { createClient } from '@/lib/supabase/server';
import type { AcompanhamentoProposta } from '@/lib/propostas/acompanhamento';

export const dynamic = 'force-dynamic';

const headers = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(
  request: Request,
  contexto: RouteContext<'/api/propostas/[id]/acompanhamento'>,
) {
  const { id } = await contexto.params;
  if (!z.uuid().safeParse(id).success) return new Response(null, { status: 404, headers });

  try {
    const acesso = await obterAcessoRecurso('propostas');
    if (!acesso.permitido) {
      return new Response(null, { status: acesso.motivo === 'sessao' ? 401 : 403, headers });
    }
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Response(null, { status: 401, headers });

    const { data, error } = await supabase
      .from('propostas')
      .select(
        'id, status, versao, compartilhamento_codigo, compartilhamento_ativo, compartilhada_em, primeira_visualizacao_em, ultima_visualizacao_em, visualizacoes, decisao_nome, decisao_email, decisao_comentario, decidida_em',
      )
      .eq('id', id)
      .eq('dono', user.id)
      .abortSignal(request.signal)
      .maybeSingle();
    if (error) throw error;
    if (!data) return new Response(null, { status: 404, headers });

    let execucaoId: string | null = null;
    if (data.status === 'aceita') {
      const execucao = await supabase
        .from('projetos_execucao')
        .select('id')
        .eq('proposta_id', id)
        .eq('dono', user.id)
        .abortSignal(request.signal)
        .maybeSingle();
      if (execucao.error) throw execucao.error;
      execucaoId = execucao.data?.id ?? null;
    }

    const acompanhamento: AcompanhamentoProposta = {
      id: data.id,
      status: data.status,
      versao: data.versao,
      execucaoId,
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
    return Response.json(acompanhamento, { headers });
  } catch {
    return Response.json(
      { erro: 'Não foi possível atualizar o acompanhamento.' },
      {
        status: 503,
        headers,
      },
    );
  }
}
