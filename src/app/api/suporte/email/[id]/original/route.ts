import { Resend } from 'resend';
import { z } from 'zod';
import { suporteEmailEnv } from '@/lib/env';
import { criarSistemaSuporte, equipeSuporte } from '@/lib/suporte/servidor';
import { corpoLimitado } from '@/lib/suporte/http';
export async function GET(
  _request: Request,
  { params }: RouteContext<'/api/suporte/email/[id]/original'>,
) {
  const { id } = await params;
  const negar = () =>
    new Response('Original indisponível.', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  if (!z.uuid().safeParse(id).success || !(await equipeSuporte())) return negar();
  const config = suporteEmailEnv();
  if (!config) return negar();
  try {
    const { data: e } = await criarSistemaSuporte()
      .from('suporte_email_recebidos')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (!e) return negar();
    const { data: email } = await new Resend(config.api).emails.receiving.get(id);
    if (!email?.raw?.download_url) return negar();
    const url = new URL(email.raw.download_url);
    if (url.protocol !== 'https:') return negar();
    const r = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!r.ok) return negar();
    const bytes = await corpoLimitado(
      new Request(url, { method: 'POST', body: r.body, duplex: 'half' } as RequestInit),
      14_000_000,
    );
    return new Response(bytes as BodyInit, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="email-${id}.eml"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "sandbox; default-src 'none'",
      },
    });
  } catch {
    return negar();
  }
}
