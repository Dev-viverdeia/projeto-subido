import { NextResponse, type NextRequest } from 'next/server';
import {
  GOOGLE_CALENDAR_COOKIES,
  retornoGoogleCalendarSeguro,
} from '@/lib/google-calendar/estado-oauth';
import {
  criarSegredosOAuth,
  googleCalendarConfigurado,
  urlAutorizacaoGoogle,
} from '@/lib/google-calendar/oauth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const retorno = retornoGoogleCalendarSeguro(request.nextUrl.searchParams.get('retorno'));
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return NextResponse.redirect(new URL('/entrar?proximo=/conta', request.url));

  if (!googleCalendarConfigurado()) {
    return NextResponse.redirect(new URL('/conta?calendar=indisponivel', request.url));
  }

  const { state, verifier, challenge } = criarSegredosOAuth();
  const loginHint = typeof claims.email === 'string' ? claims.email : undefined;
  const resposta = NextResponse.redirect(urlAutorizacaoGoogle({ state, challenge, loginHint }));
  const comum = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/api/integracoes/google-calendar',
    maxAge: 10 * 60,
  };
  resposta.cookies.set(GOOGLE_CALENDAR_COOKIES.state, state, comum);
  resposta.cookies.set(GOOGLE_CALENDAR_COOKIES.verifier, verifier, comum);
  resposta.cookies.set(GOOGLE_CALENDAR_COOKIES.retorno, retorno, comum);
  return resposta;
}
