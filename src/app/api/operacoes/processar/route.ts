import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { cronEnv } from '@/lib/env';
import { processarLoteOperacoes } from '@/lib/operacoes/processar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function autorizado(request: Request, segredo: string) {
  const recebido = request.headers.get('authorization') ?? '';
  const esperado = `Bearer ${segredo}`;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.byteLength === b.byteLength && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const ambiente = cronEnv();
  if (!ambiente || !autorizado(request, ambiente.CRON_SECRET)) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const resultado = await processarLoteOperacoes(4);
    return NextResponse.json(resultado, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (causa) {
    console.error('[operacoes:cron] falha:', causa);
    return NextResponse.json(
      { erro: 'A rodada operacional não foi concluída.' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
