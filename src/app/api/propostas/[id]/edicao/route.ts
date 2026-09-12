import { z } from 'zod';
import { obterAcessoRecurso } from '@/lib/planos/server';
import { createClient } from '@/lib/supabase/server';
import { EdicaoPropostaSchema } from '@/lib/propostas/edicao';

export const dynamic = 'force-dynamic';
const headers = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

/** Leitura sob demanda; não registra visualização nem altera a proposta. */
export async function GET(request: Request, contexto: RouteContext<'/api/propostas/[id]/edicao'>) {
  const { id } = await contexto.params;
  if (!z.uuid().safeParse(id).success) return new Response(null, { status: 404, headers });
  try {
    const acesso = await obterAcessoRecurso('propostas');
    if (!acesso.permitido)
      return new Response(null, { status: acesso.motivo === 'sessao' ? 401 : 403, headers });
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Response(null, { status: 401, headers });
    const { data, error } = await supabase
      .from('propostas')
      .select('id, titulo, documento, versao, status')
      .eq('id', id)
      .eq('dono', user.id)
      .abortSignal(request.signal)
      .maybeSingle();
    if (error) throw error;
    if (!data) return new Response(null, { status: 404, headers });
    return Response.json(EdicaoPropostaSchema.parse(data), { headers });
  } catch {
    return Response.json(
      { erro: 'Não foi possível conferir a versão salva.' },
      { status: 503, headers },
    );
  }
}
