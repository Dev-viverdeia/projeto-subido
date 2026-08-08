import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  obterAvaliacaoPorOrigem,
  obterAvaliacaoRecente,
  obterSugestaoRecente,
  persistirSegmentos,
  persistirSugestao,
} from '@/lib/calls/admin';
import { LoteSegmentosSchema } from '@/lib/calls/coach-schema';
import { obterContextoCoach } from '@/lib/calls/contexto-coach';
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
    const ultimo = corpo.data.segmentos.at(-1)!;
    const jaAvaliada = await obterAvaliacaoPorOrigem({
      dono: contexto.dono,
      reuniaoId: contexto.reuniaoId,
      origemItemId: ultimo.itemId,
    });
    const recente = await obterSugestaoRecente({
      dono: contexto.dono,
      reuniaoId: contexto.reuniaoId,
    });
    if (jaAvaliada) {
      return NextResponse.json(
        {
          estado: jaAvaliada.status === 'dispensada' ? 'observando' : 'sugestao',
          sugestao: jaAvaliada.status === 'dispensada' ? recente : jaAvaliada,
        },
        { headers: semCache() },
      );
    }

    const ultimaAvaliacao = await obterAvaliacaoRecente({
      dono: contexto.dono,
      reuniaoId: contexto.reuniaoId,
    });
    if (
      ultimaAvaliacao &&
      Date.now() - new Date(ultimaAvaliacao.criada_em).getTime() < INTERVALO_SUGESTAO_MS
    ) {
      return NextResponse.json(
        { estado: 'observando', sugestao: recente },
        { headers: semCache() },
      );
    }

    const janela = segmentos.slice(-10);
    if (janela.reduce((total, segmento) => total + segmento.texto.length, 0) < 70) {
      return NextResponse.json(
        { estado: 'observando', sugestao: recente },
        { headers: semCache() },
      );
    }

    const rodada = await gerarSugestaoCoach({ usuarioId: user.id, contexto, segmentos: janela });
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
        { estado: 'observando', sugestao: recente },
        { headers: semCache() },
      );
    }

    return NextResponse.json({ estado: 'sugestao', sugestao: salva }, { headers: semCache() });
  } catch (causa) {
    if (causa instanceof ErroModeloCoach) return erro(causa.message, 503);
    console.error('[calls:coach] falha:', causa);
    return erro('O Live Coach não conseguiu processar este trecho.', 500);
  }
}
