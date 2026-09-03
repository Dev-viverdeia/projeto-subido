import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { cronEnv } from '@/lib/env';
import { processarLembretesValidacao } from '@/lib/notificacoes/lembretes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function autorizado(request: Request, segredo: string) {
  const recebido = Buffer.from(request.headers.get('authorization') ?? '');
  const esperado = Buffer.from(`Bearer ${segredo}`);
  return recebido.byteLength === esperado.byteLength && timingSafeEqual(recebido, esperado);
}

export async function GET(request: Request) {
  const ambiente = cronEnv();
  if (!ambiente || !autorizado(request, ambiente.CRON_SECRET)) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const resultado = await processarLembretesValidacao();
    return NextResponse.json(resultado, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (erro) {
    console.error(
      '[notificacoes:cron-lembretes]',
      erro instanceof Error ? erro.message : 'falha_inesperada',
    );
    return NextResponse.json(
      { erro: 'Os lembretes não foram processados.' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
