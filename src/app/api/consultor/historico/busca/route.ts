import { NextResponse } from 'next/server';
import { BuscaGlobalSchema } from '@/lib/consultor/busca-global-contrato';
import { buscarMensagensHistorico } from '@/lib/consultor/busca-global-queries';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: Request) {
  const validacao = BuscaGlobalSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!validacao.success)
    return NextResponse.json(
      { erro: 'Digite entre 2 e 120 caracteres.' },
      { status: 400, headers },
    );
  try {
    const { dono, busca, pagina } = validacao.data;
    const dados = await buscarMensagensHistorico(dono, busca, pagina);
    if (!dados)
      return NextResponse.json(
        { erro: 'Entre novamente na mesma conta.' },
        { status: 401, headers },
      );
    return NextResponse.json(dados, { headers });
  } catch {
    return NextResponse.json(
      { erro: 'Não foi possível buscar no histórico. Tente novamente.' },
      { status: 503, headers },
    );
  }
}
