import { NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/lib/env';
import { criarSistemaSuporte, cookieSuporte, hashAcesso } from '@/lib/suporte/servidor';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const p = z
    .object({ id: z.uuid(), chave: z.string().regex(/^[a-f0-9]{64}$/) })
    .safeParse(Object.fromEntries(url.searchParams));
  const erro = () => {
    const response = NextResponse.redirect(
      new URL('/ajuda/acesso?erro=link', env.NEXT_PUBLIC_SITE_URL),
    );
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  };
  if (!p.success) return erro();
  try {
    const { data, error } = await criarSistemaSuporte().rpc('suporte_publico_confirmar', {
      p_id: p.data.id,
      p_hash: hashAcesso(p.data.chave),
    });
    if (error || !data) return erro();
    const response = NextResponse.redirect(
      new URL(`/ajuda/atendimento/${p.data.id}`, env.NEXT_PUBLIC_SITE_URL),
    );
    response.cookies.set(cookieSuporte(p.data.id), p.data.chave, {
      httpOnly: true,
      secure: env.NEXT_PUBLIC_SITE_URL.startsWith('https:'),
      sameSite: 'lax',
      path: '/',
      maxAge: 14 * 86400,
    });
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch {
    return erro();
  }
}
