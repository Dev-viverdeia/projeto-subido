import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { iniciarReuniao } from '@/lib/calls/admin';
import { contextoTranscricaoParaTexto, obterContextoCoach } from '@/lib/calls/contexto-coach';
import { requisicaoDaMesmaOrigem, semCache } from '@/lib/calls/http';
import { openAIEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IdSchema = z.uuid();

function erro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status, headers: semCache() });
}

function identificadorSeguro(usuarioId: string) {
  return `subido_call_${createHash('sha256').update(usuarioId).digest('hex').slice(0, 32)}`;
}

export async function POST(request: Request, rota: { params: Promise<{ id: string }> }) {
  try {
    if (!requisicaoDaMesmaOrigem(request)) return erro('Origem da solicitação inválida.', 403);
    if (!request.headers.get('content-type')?.startsWith('application/sdp')) {
      return erro('Oferta de áudio inválida.', 415);
    }

    const { id } = await rota.params;
    if (!IdSchema.safeParse(id).success) return erro('Reunião inválida.', 400);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return erro('Faça login para ativar o Live Coach.', 401);

    const contexto = await obterContextoCoach(supabase, id);
    if (!contexto) return erro('Reunião não encontrada.', 404);

    const sdp = await request.text();
    if (sdp.length < 40 || sdp.length > 120_000) return erro('Oferta de áudio inválida.', 400);

    const { OPENAI_API_KEY } = openAIEnv();
    const sessao = {
      type: 'transcription',
      audio: {
        input: {
          format: {
            type: 'audio/pcm',
            rate: 24_000,
          },
          noise_reduction: { type: 'far_field' },
          transcription: {
            model: 'gpt-live-transcribe',
            prompt: `Reunião comercial em português do Brasil. Preserve nomes próprios e termos de IA. ${contextoTranscricaoParaTexto(contexto)}`,
            languages: ['pt'],
            delay: 'low',
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 700,
          },
        },
      },
    };
    const formulario = new FormData();
    formulario.set('sdp', sdp);
    formulario.set('session', JSON.stringify(sessao));

    const respostaOpenAI = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Safety-Identifier': identificadorSeguro(user.id),
      },
      body: formulario,
      cache: 'no-store',
    });
    const respostaSdp = await respostaOpenAI.text();
    if (!respostaOpenAI.ok) {
      console.error(
        `[calls:realtime] OpenAI ${respostaOpenAI.status} · request ${respostaOpenAI.headers.get('x-request-id') ?? 'sem-id'}`,
      );
      return erro('A transcrição ao vivo não pôde ser iniciada agora.', 502);
    }

    await iniciarReuniao({
      dono: contexto.dono,
      reuniaoId: contexto.reuniaoId,
      iniciadaEm: contexto.iniciadaEm,
    });

    return new Response(respostaSdp, {
      status: 201,
      headers: { ...semCache(), 'Content-Type': 'application/sdp' },
    });
  } catch (causa) {
    console.error('[calls:realtime] falha:', causa);
    return erro('Não foi possível iniciar a inteligência da reunião.', 500);
  }
}
