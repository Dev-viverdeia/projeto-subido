import { NextResponse } from 'next/server';
import { BuscaConversasSchema } from '@/lib/consultor/historico-contrato';
import { obterHistorico } from '@/lib/consultor/historico-queries';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: Request) {
  const parametros = Object.fromEntries(new URL(request.url).searchParams);
  const validacao = BuscaConversasSchema.safeParse(parametros);
  if (!validacao.success)
    return NextResponse.json({ erro: 'Revise sua busca.' }, { status: 400, headers });
  try {
    const { busca, pagina, dono } = validacao.data;
    const resultado = await obterHistorico(busca, pagina, dono);
    if (!resultado)
      return NextResponse.json(
        { erro: 'Entre novamente na mesma conta.' },
        { status: 401, headers },
      );
    return NextResponse.json(resultado, { headers });
  } catch {
    return NextResponse.json(
      { erro: 'Não foi possível buscar as conversas. Tente novamente.' },
      { status: 503, headers },
    );
  }
}
