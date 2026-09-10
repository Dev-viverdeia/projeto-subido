import { NextResponse } from 'next/server';
import { BuscarSalvasSchema } from '@/lib/consultor/salvas-contrato';
import { buscarRespostasSalvas } from '@/lib/consultor/salvas-queries';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: Request) {
  const validacao = BuscarSalvasSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!validacao.success)
    return NextResponse.json(
      { erro: 'Confira a busca e tente novamente.' },
      { status: 400, headers },
    );
  try {
    const { dono, busca, pagina } = validacao.data;
    const dados = await buscarRespostasSalvas(dono, busca, pagina);
    if (!dados)
      return NextResponse.json(
        { erro: 'Entre novamente na mesma conta.' },
        { status: 401, headers },
      );
    return NextResponse.json(dados, { headers });
  } catch {
    return NextResponse.json(
      { erro: 'Não foi possível carregar as respostas salvas.' },
      { status: 503, headers },
    );
  }
}
