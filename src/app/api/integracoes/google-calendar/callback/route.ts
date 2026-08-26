import { NextResponse, type NextRequest } from 'next/server';
import { cifrarTokenGoogle } from '@/lib/google-calendar/tokens';
import {
  GOOGLE_CALENDAR_COOKIES,
  retornoGoogleCalendarSeguro,
} from '@/lib/google-calendar/estado-oauth';
import {
  ESCOPOS_GOOGLE_CALENDAR,
  obterPerfilGoogle,
  redirectUriGoogleCalendar,
  trocarCodigoPorTokens,
} from '@/lib/google-calendar/oauth';
import { destinoPonteGoogleCalendar } from '@/lib/google-calendar/ponte-callback';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

function limparCookies(resposta: NextResponse) {
  for (const nome of Object.values(GOOGLE_CALENDAR_COOKIES)) {
    resposta.cookies.set(nome, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/integracoes/google-calendar',
      maxAge: 0,
    });
  }
  return resposta;
}

function destinoComEstado(request: NextRequest, estado: 'conectado' | 'erro') {
  const retorno = retornoGoogleCalendarSeguro(
    request.cookies.get(GOOGLE_CALENDAR_COOKIES.retorno)?.value,
  );
  const destino = new URL(retorno, request.url);
  destino.searchParams.set('calendar', estado);
  return destino;
}

export async function GET(request: NextRequest) {
  const destinoPonte = destinoPonteGoogleCalendar({
    requestUrl: request.nextUrl,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    redirectUri: redirectUriGoogleCalendar(),
  });
  if (destinoPonte) return NextResponse.redirect(destinoPonte);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) {
    return limparCookies(NextResponse.redirect(new URL('/entrar?proximo=/conta', request.url)));
  }

  const stateRecebido = request.nextUrl.searchParams.get('state');
  const stateEsperado = request.cookies.get(GOOGLE_CALENDAR_COOKIES.state)?.value;
  const verifier = request.cookies.get(GOOGLE_CALENDAR_COOKIES.verifier)?.value;
  const codigo = request.nextUrl.searchParams.get('code');
  const recusado = request.nextUrl.searchParams.has('error');

  if (recusado || !codigo || !verifier || !stateRecebido || stateRecebido !== stateEsperado) {
    return limparCookies(NextResponse.redirect(destinoComEstado(request, 'erro')));
  }

  try {
    const tokens = await trocarCodigoPorTokens(codigo, verifier);
    if (!tokens.refresh_token) throw new Error('O Google não devolveu um refresh token.');
    const perfil = await obterPerfilGoogle(tokens.access_token);
    const escopos = tokens.scope?.split(/\s+/).filter(Boolean) ?? [...ESCOPOS_GOOGLE_CALENDAR];
    const { error } = await supabase.rpc('google_calendar_salvar_conexao', {
      p_google_sub: perfil.sub,
      p_google_email: perfil.email,
      p_refresh_token_cifrado: cifrarTokenGoogle(tokens.refresh_token),
      p_escopos: escopos,
    });
    if (error) throw error;
    return limparCookies(NextResponse.redirect(destinoComEstado(request, 'conectado')));
  } catch (erro) {
    console.error('[google-calendar:callback]', erro);
    return limparCookies(NextResponse.redirect(destinoComEstado(request, 'erro')));
  }
}
