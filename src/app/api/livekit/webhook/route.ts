import { WebhookReceiver } from 'livekit-server-sdk';
import { after, NextResponse } from 'next/server';
import { sincronizarGravacaoDoEgress } from '@/lib/calls/gravacao';
import { processarPosCall } from '@/lib/calls/processamento';
import { livekitEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  const configuracao = livekitEnv();
  if (!configuracao) {
    return NextResponse.json({ erro: 'LiveKit não configurado.' }, { status: 503 });
  }

  try {
    const corpo = await request.text();
    const receptor = new WebhookReceiver(
      configuracao.LIVEKIT_API_KEY,
      configuracao.LIVEKIT_API_SECRET,
    );
    const evento = await receptor.receive(corpo, request.headers.get('authorization') ?? undefined);

    if (evento.egressInfo) {
      const gravacao = await sincronizarGravacaoDoEgress(evento.egressInfo);
      if (evento.event === 'egress_ended' && gravacao) {
        after(async () => {
          await processarPosCall(gravacao.reuniaoId).catch((causa) => {
            console.error('[livekit:webhook:pos-call] falha:', causa);
          });
        });
      }
    }

    return NextResponse.json({ recebido: true });
  } catch (causa) {
    console.error('[livekit:webhook] evento rejeitado:', causa);
    return NextResponse.json({ erro: 'Evento inválido.' }, { status: 401 });
  }
}
