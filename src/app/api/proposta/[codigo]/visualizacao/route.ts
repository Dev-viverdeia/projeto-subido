import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { registrarVisualizacaoProposta } from '@/lib/propostas/portal';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  contexto: RouteContext<'/api/proposta/[codigo]/visualizacao'>,
) {
  const { codigo } = await contexto.params;
  if (!z.uuid().safeParse(codigo).success) {
    return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const marcador = `subido_proposta_${codigo.replaceAll('-', '')}`;
  if (request.cookies.get(marcador)?.value === '1') {
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const registrada = await registrarVisualizacaoProposta(codigo);
    if (!registrada) {
      return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }

    const resposta = new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
    resposta.cookies.set(marcador, '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 60,
      path: `/proposta/${codigo}`,
    });
    return resposta;
  } catch (erro) {
    console.error(
      `[proposta-portal:visualizacao] ${erro instanceof Error ? erro.message : 'erro_desconhecido'}`,
    );
    return new NextResponse(null, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
