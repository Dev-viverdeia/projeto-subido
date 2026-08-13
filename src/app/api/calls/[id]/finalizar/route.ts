import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  encerrarReuniao,
  marcarAnaliseComoFalha,
  marcarAnaliseSemConteudo,
  marcarReuniaoProcessando,
  persistirAnalise,
  persistirSegmentos,
} from '@/lib/calls/admin';
import { SegmentoLiveSchema } from '@/lib/calls/coach-schema';
import { obterContextoCoach } from '@/lib/calls/contexto-coach';
import { requisicaoDaMesmaOrigem, semCache } from '@/lib/calls/http';
import { ErroModeloCoach, gerarAnaliseCall } from '@/lib/calls/modelo-coach';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IdSchema = z.uuid();
const CorpoSchema = z.object({ segmentos: z.array(SegmentoLiveSchema).max(24).default([]) });

function erro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status, headers: semCache() });
}

export async function POST(request: Request, rota: { params: Promise<{ id: string }> }) {
  let contexto: Awaited<ReturnType<typeof obterContextoCoach>> = null;
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

    contexto = await obterContextoCoach(supabase, id);
    if (!contexto) return erro('Reunião não encontrada.', 404);

    const segmentos = await persistirSegmentos({
      dono: contexto.dono,
      reuniaoId: contexto.reuniaoId,
      segmentos: corpo.data.segmentos,
      concluir: true,
    });
    await marcarReuniaoProcessando({ dono: contexto.dono, reuniaoId: contexto.reuniaoId });

    if (segmentos.reduce((total, segmento) => total + segmento.texto.length, 0) < 80) {
      await marcarAnaliseSemConteudo({
        dono: contexto.dono,
        reuniaoId: contexto.reuniaoId,
      });
      await encerrarReuniao({ dono: contexto.dono, reuniaoId: contexto.reuniaoId });
      revalidarDirecaoOperacional();
      return NextResponse.json({ estado: 'concluida_sem_analise' }, { headers: semCache() });
    }

    const rodada = await gerarAnaliseCall({ usuarioId: user.id, contexto, segmentos });
    await persistirAnalise({
      dono: contexto.dono,
      reuniaoId: contexto.reuniaoId,
      analise: rodada.analise,
      modelo: rodada.modelo,
      respostaId: rodada.respostaId,
    });

    revalidarDirecaoOperacional();
    return NextResponse.json({ estado: 'concluida' }, { headers: semCache() });
  } catch (causa) {
    console.error('[calls:finalizar] falha:', causa);
    if (contexto) {
      await marcarAnaliseComoFalha({
        dono: contexto.dono,
        reuniaoId: contexto.reuniaoId,
        mensagem: causa instanceof Error ? causa.message : 'Falha não classificada.',
      });
      await encerrarReuniao({ dono: contexto.dono, reuniaoId: contexto.reuniaoId }).catch(
        () => null,
      );
      revalidarDirecaoOperacional();
    }
    return erro(
      causa instanceof ErroModeloCoach
        ? 'A reunião foi salva, mas a análise automática não ficou disponível.'
        : 'Não foi possível concluir o processamento da reunião.',
      500,
    );
  }
}
