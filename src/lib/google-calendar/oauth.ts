import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { env, googleCalendarEnv } from '@/lib/env';

const ESCOPO_CALENDARIO = 'https://www.googleapis.com/auth/calendar.events.owned';
export const ESCOPOS_GOOGLE_CALENDAR = ['openid', 'email', ESCOPO_CALENDARIO] as const;

const TokenSchema = z.object({
  access_token: z.string().min(10),
  expires_in: z.number().int().positive().optional(),
  refresh_token: z.string().min(10).optional(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
  id_token: z.string().optional(),
});

const PerfilSchema = z.object({
  sub: z.string().min(3),
  email: z.email(),
  email_verified: z.boolean().optional(),
});

export type TokensGoogle = z.infer<typeof TokenSchema>;

export class GoogleCalendarPrecisaReconectar extends Error {
  constructor() {
    super('A autorização do Google Calendar expirou.');
    this.name = 'GoogleCalendarPrecisaReconectar';
  }
}

function configuracaoObrigatoria() {
  const configuracao = googleCalendarEnv();
  if (!configuracao) throw new Error('Google Calendar ainda não foi configurado.');
  return configuracao;
}

export function googleCalendarConfigurado() {
  return googleCalendarEnv() !== null;
}

export function redirectUriGoogleCalendar() {
  return (
    googleCalendarEnv()?.GOOGLE_CALENDAR_REDIRECT_URI ??
    new URL('/api/integracoes/google-calendar/callback', env.NEXT_PUBLIC_SITE_URL).toString()
  );
}

export function criarSegredosOAuth() {
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { state, verifier, challenge };
}

export function urlAutorizacaoGoogle({
  state,
  challenge,
  loginHint,
}: {
  state: string;
  challenge: string;
  loginHint?: string;
}) {
  const configuracao = configuracaoObrigatoria();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', configuracao.GOOGLE_CALENDAR_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUriGoogleCalendar());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', ESCOPOS_GOOGLE_CALENDAR.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  if (loginHint) url.searchParams.set('login_hint', loginHint);
  return url;
}

export async function trocarCodigoPorTokens(codigo: string, verifier: string) {
  const configuracao = configuracaoObrigatoria();
  const resposta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: codigo,
      client_id: configuracao.GOOGLE_CALENDAR_CLIENT_ID,
      client_secret: configuracao.GOOGLE_CALENDAR_CLIENT_SECRET,
      redirect_uri: redirectUriGoogleCalendar(),
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
    cache: 'no-store',
  });
  if (!resposta.ok) throw new Error(`Falha no OAuth do Google (${resposta.status}).`);
  return TokenSchema.parse(await resposta.json());
}

export async function renovarTokenGoogle(refreshToken: string) {
  const configuracao = configuracaoObrigatoria();
  const resposta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: configuracao.GOOGLE_CALENDAR_CLIENT_ID,
      client_secret: configuracao.GOOGLE_CALENDAR_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });
  if (!resposta.ok) {
    const corpo: unknown = await resposta.json().catch(() => null);
    if (corpo && typeof corpo === 'object' && 'error' in corpo && corpo.error === 'invalid_grant') {
      throw new GoogleCalendarPrecisaReconectar();
    }
    throw new Error(`Não foi possível renovar o acesso ao Google (${resposta.status}).`);
  }
  return TokenSchema.parse(await resposta.json());
}

export async function obterPerfilGoogle(accessToken: string) {
  const resposta = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!resposta.ok)
    throw new Error(`Não foi possível identificar a conta Google (${resposta.status}).`);
  return PerfilSchema.parse(await resposta.json());
}

export async function revogarTokenGoogle(token: string) {
  await fetch('https://oauth2.googleapis.com/revoke', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
    cache: 'no-store',
  });
}
