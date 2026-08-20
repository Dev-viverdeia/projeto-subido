import { NextResponse } from 'next/server';
import { z } from 'zod';
import { obterContextoCoach } from '@/lib/calls/contexto-coach';
import { iniciarGravacao } from '@/lib/calls/gravacao';
import { requisicaoDaMesmaOrigem, semCache } from '@/lib/calls/http';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IdSchema = z.uuid();

function erro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status, headers: semCache() });
}

export async function POST(request: Request, rota: { params: Promise<{ id: string }> }) {
  try {
    if (!requisicaoDaMesmaOrigem(request)) return erro('Origem da solicitação inválida.', 403);
    const { id } = await rota.params;
    if (!IdSchema.safeParse(id).success) return erro('Reunião inválida.', 400);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return erro('Faça login para gravar esta reunião.', 401);

    const contexto = await obterContextoCoach(supabase, id);
    if (!contexto) return erro('Reunião não encontrada.', 404);

    const origem = new URL(request.url).origin;
    const gravacao = await iniciarGravacao({
      dono: contexto.dono,
      reuniaoId: contexto.reuniaoId,
      salaProvedor: contexto.salaProvedor,
      origem,
    });

    return NextResponse.json(
      { id: gravacao.id, status: gravacao.status },
      { status: gravacao.status === 'gravando' ? 201 : 200, headers: semCache() },
    );
  } catch (causa) {
    console.error('[calls:gravacao] falha:', causa);
    return erro('A reunião continua ativa, mas a gravação não pôde ser iniciada.', 503);
  }
}
