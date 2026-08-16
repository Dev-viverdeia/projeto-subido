import { after, NextResponse } from 'next/server';
import { z } from 'zod';
import { marcarReuniaoProcessando, persistirSegmentos } from '@/lib/calls/admin';
import { SegmentoLiveSchema } from '@/lib/calls/coach-schema';
import { obterContextoCoach } from '@/lib/calls/contexto-coach';
import { requisicaoDaMesmaOrigem, semCache } from '@/lib/calls/http';
import { processarPosCall } from '@/lib/calls/processamento';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const IdSchema = z.uuid();
const CorpoSchema = z.object({ segmentos: z.array(SegmentoLiveSchema).max(24).default([]) });

function erro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status, headers: semCache() });
}

export async function POST(request: Request, rota: { params: Promise<{ id: string }> }) {
  try {
    if (!requisicaoDaMesmaOrigem(request)) return erro('Origem da solicitação inválida.', 403);
    const { id } = await rota.params;
    if (!IdSchema.safeParse(id).success) return erro('Reunião inválida.', 400);
    const corpo = CorpoSchema.safeParse(await request.json().catch(() => ({})));
    if (!corpo.success) return erro('Trecho final inválido.', 400);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return erro('Faça login para finalizar esta reunião.', 401);

    const contexto = await obterContextoCoach(supabase, id);
    if (!contexto) return erro('Reunião não encontrada.', 404);

    await persistirSegmentos({
      dono: contexto.dono,
      reuniaoId: contexto.reuniaoId,
      segmentos: corpo.data.segmentos,
      concluir: true,
    });
    await marcarReuniaoProcessando({ dono: contexto.dono, reuniaoId: contexto.reuniaoId });

    after(async () => {
      await processarPosCall(contexto.reuniaoId).catch((causa) => {
        console.error('[calls:finalizar:worker] falha:', causa);
      });
    });

    return NextResponse.json(
      { estado: 'processando', mensagem: 'A conversa já foi salva no histórico.' },
      { status: 202, headers: semCache() },
    );
  } catch (causa) {
    console.error('[calls:finalizar] falha:', causa);
    return erro('Não foi possível concluir o processamento da reunião.', 500);
  }
}
