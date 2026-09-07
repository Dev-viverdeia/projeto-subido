import { NextResponse } from 'next/server';
import { z } from 'zod';
import { obterAvaliacaoPorOrigem, persistirSegmentos, persistirSugestao } from '@/lib/calls/admin';
import { LoteSegmentosSchema } from '@/lib/calls/coach-schema';
import { obterContextoCoach } from '@/lib/calls/contexto-coach';
import { obterMemoriaCoach } from '@/lib/calls/coach-memoria';
import { requisicaoDaMesmaOrigem, semCache } from '@/lib/calls/http';
import { ErroModeloCoach, gerarSugestaoCoach } from '@/lib/calls/modelo-coach';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IdSchema = z.uuid();
const INTERVALO_SUGESTAO_MS = 22_000;

function erro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status, headers: semCache() });
}

export async function POST(request: Request, rota: { params: Promise<{ id: string }> }) {
  try {
    if (!requisicaoDaMesmaOrigem(request)) return erro('Origem da solicitação inválida.', 403);
    const { id } = await rota.params;
    if (!IdSchema.safeParse(id).success) return erro('Reunião inválida.', 400);

    const corpo = LoteSegmentosSchema.safeParse(await request.json().catch(() => null));
    if (!corpo.success) return erro('Trecho de transcrição inválido.', 400);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return erro('Faça login para usar o Live Coach.', 401);

    const contexto = await obterContextoCoach(supabase, id);
    if (!contexto) return erro('Reunião não encontrada.', 404);

    const segmentos = await persistirSegmentos({
      dono: contexto.dono,
      reuniaoId: contexto.reuniaoId,
      segmentos: corpo.data.segmentos,
    });
    if (!contexto.liveCoachAtivo) {
      return NextResponse.json({ estado: 'memoria', sugestao: null }, { headers: semCache() });
    }
    const ultimo = segmentos.at(-1)!;
    const jaAvaliada = await obterAvaliacaoPorOrigem({
      dono: contexto.dono,
      reuniaoId: contexto.reuniaoId,
      origemItemId: ultimo.itemId,
    });
    const memoria = await obterMemoriaCoach(supabase, contexto.dono, contexto.reuniaoId);
    const observar = () =>
      NextResponse.json(
        { estado: 'observando', sugestao: memoria.vigente, historico: memoria.historico },
        { headers: semCache() },
      );
    if (jaAvaliada) {
      return observar();
    }

    const ultimaAvaliacao = memoria.ultima;
    if (
      ultimaAvaliacao &&
      Date.now() - new Date(ultimaAvaliacao.criada_em).getTime() < INTERVALO_SUGESTAO_MS
    ) {
      return observar();
    }

    const janela = segmentos.slice(-16);
    if (janela.reduce((total, segmento) => total + segmento.texto.length, 0) < 70) {
      return observar();
    }

    const rodada = await gerarSugestaoCoach({
      usuarioId: user.id,
      contexto,
      segmentos: janela,
      anteriores: memoria.historico,
    });
    const salva = await persistirSugestao({
      dono: contexto.dono,
      reuniaoId: contexto.reuniaoId,
      origemItemId: ultimo.itemId,
      segundoReuniao: ultimo.segundoReuniao,
      resposta: rodada.sugestao,
      modelo: rodada.modelo,
      respostaId: rodada.respostaId,
    });

    if (!rodada.sugestao.intervir) {
      return NextResponse.json(
        { estado: 'observando', sugestao: null, historico: memoria.historico },
        { headers: semCache() },
      );
    }

    return NextResponse.json(
      { estado: 'sugestao', sugestao: salva, historico: memoria.historico },
      { headers: semCache() },
    );
  } catch (causa) {
    if (causa instanceof ErroModeloCoach) return erro(causa.message, 503);
    console.error('[calls:coach] falha:', causa);
    return erro('O Live Coach não conseguiu processar este trecho.', 500);
  }
}
