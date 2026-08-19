import 'server-only';

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { googleCalendarEnv } from '@/lib/env';

const VERSAO = 'v1';

function chave() {
  const configuracao = googleCalendarEnv();
  if (!configuracao) throw new Error('Google Calendar não configurado no servidor.');
  return Buffer.from(configuracao.GOOGLE_CALENDAR_TOKEN_KEY, 'base64');
}

/** AES-256-GCM: confidencialidade e autenticação num único envelope versionado. */
export function cifrarTokenGoogle(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', chave(), iv);
  const conteudo = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSAO,
    iv.toString('base64url'),
    tag.toString('base64url'),
    conteudo.toString('base64url'),
  ].join('.');
}

export function decifrarTokenGoogle(envelope: string) {
  const [versao, ivBruto, tagBruta, conteudoBruto] = envelope.split('.');
  if (versao !== VERSAO || !ivBruto || !tagBruta || !conteudoBruto) {
    throw new Error('Token do Google Calendar em formato inválido.');
  }

  const decipher = createDecipheriv('aes-256-gcm', chave(), Buffer.from(ivBruto, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagBruta, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(conteudoBruto, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
