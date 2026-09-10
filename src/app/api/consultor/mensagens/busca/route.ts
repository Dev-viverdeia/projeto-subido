import { NextResponse } from 'next/server';
import { BuscaMensagensSchema } from '@/lib/consultor/busca-mensagens-contrato';
import { buscarMensagensConversa } from '@/lib/consultor/busca-mensagens-queries';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: Request) {
  const validacao = BuscaMensagensSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!validacao.success)
    return NextResponse.json(
      { erro: 'Digite entre 2 e 120 caracteres.' },
      { status: 400, headers },
    );
  try {
    const { conversa, dono, busca, pagina } = validacao.data;
    const dados = await buscarMensagensConversa(conversa, dono, busca, pagina);
    if (!dados)
      return NextResponse.json(
        { erro: 'Entre novamente na mesma conta.' },
        { status: 401, headers },
      );
    return NextResponse.json(dados, { headers });
  } catch {
    return NextResponse.json(
      { erro: 'Não foi possível buscar as mensagens. Tente novamente.' },
      { status: 503, headers },
    );
  }
}
