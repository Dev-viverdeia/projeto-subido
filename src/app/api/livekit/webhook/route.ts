import { WebhookReceiver } from 'livekit-server-sdk';
import { after, NextResponse } from 'next/server';
import { sincronizarGravacaoDoEgress } from '@/lib/calls/gravacao';
import { livekitEnv } from '@/lib/env';
import { enfileirarOperacao } from '@/lib/operacoes/admin';
import { processarOperacaoPorId } from '@/lib/operacoes/processar';

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
        const operacao = await enfileirarOperacao({
          dono: gravacao.dono,
          tipo: 'pos_call',
          chaveIdempotencia: `pos_call:${gravacao.reuniaoId}`,
          referenciaTipo: 'call_reuniao',
          referenciaId: gravacao.reuniaoId,
          payload: { reuniaoId: gravacao.reuniaoId },
          prioridade: 20,
          maxTentativas: 6,
        });
        after(() => processarOperacaoPorId(operacao.id));
      }
    }

    return NextResponse.json({ recebido: true });
  } catch (causa) {
    console.error('[livekit:webhook] evento rejeitado:', causa);
    return NextResponse.json({ erro: 'Evento inválido.' }, { status: 401 });
  }
}
