import { NextResponse } from 'next/server';
import { BuscaArquivosConversaSchema } from '@/lib/consultor/arquivos-conversa-contrato';
import { obterArquivosConversa } from '@/lib/consultor/arquivos-conversa-queries';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: Request) {
  const validacao = BuscaArquivosConversaSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!validacao.success)
    return NextResponse.json({ erro: 'Revise sua busca.' }, { status: 400, headers });
  try {
    const { conversa, dono, busca, pagina } = validacao.data;
    const dados = await obterArquivosConversa(conversa, dono, busca, pagina);
    if (!dados)
      return NextResponse.json(
        { erro: 'Entre novamente na mesma conta.' },
        { status: 401, headers },
      );
    return NextResponse.json(dados, { headers });
  } catch {
    return NextResponse.json(
      { erro: 'Não foi possível buscar os arquivos. Tente novamente.' },
      { status: 503, headers },
    );
  }
}
