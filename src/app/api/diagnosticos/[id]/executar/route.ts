import { z } from 'zod';
import { executarDiagnostico } from '@/lib/diagnosticos/servico';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: Request,
  contexto: RouteContext<'/api/diagnosticos/[id]/executar'>,
) {
  const { id: bruto } = await contexto.params;
  const id = z.uuid().safeParse(bruto);
  if (!id.success) return Response.json({ erro: 'Diagnóstico inválido.' }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ erro: 'Faça login para continuar.' }, { status: 401 });

  const resultado = await executarDiagnostico(id.data, user.id);
  return Response.json(resultado, { status: resultado.estado === 'falhou' ? 422 : 200 });
}
