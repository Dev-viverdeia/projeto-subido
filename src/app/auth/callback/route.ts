import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { destinoSeguro, PARAM_PROXIMO, ROTA_ENTRAR } from '@/lib/routes';

/**
 * Os únicos tipos de OTP que ESTE app dispara.
 *
 * Um `as EmailOtpType` na leitura do parâmetro não valida nada: o tipo da lib
 * termina em `(string & {})`, então ele aceita qualquer string e a asserção some na
 * compilação. Com a allowlist, um `?type=` inventado cai no ramo de link inválido em
 * vez de virar uma chamada de `verifyOtp` com entrada arbitrária.
 */
const TIPOS_ACEITOS: readonly string[] = ['signup', 'recovery', 'email_change', 'invite'];

function tipoValido(valor: string | null): EmailOtpType | null {
  /* Sem asserção: como `EmailOtpType` termina em `(string & {})`, uma string comum
     já é atribuível a ele. A verificação em runtime é quem faz o trabalho — o tipo
     nunca fez. */
  return valor !== null && TIPOS_ACEITOS.includes(valor) ? valor : null;
}

/**
 * Destino dos links de e-mail: confirmação de conta e redefinição de senha.
 *
 * Fora do grupo `(auth)` porque é um Route Handler, não uma página — e fora do
 * matcher do proxy porque é aqui que a sessão NASCE. Se o proxy rodasse antes,
 * veria uma requisição sem sessão e mandaria a pessoa para `/entrar`, quebrando
 * justamente o link que ela acabou de abrir no e-mail.
 *
 * Dois formatos chegam aqui, e os dois precisam funcionar:
 *   · `?code=` — fluxo PKCE (OAuth e magic link mais novo)
 *   · `?token_hash=&type=` — links de e-mail do Supabase
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = tipoValido(searchParams.get('type'));

  /* Mesma allowlist do login: este `proximo` vem de uma URL de e-mail, que é tão
     controlada pelo usuário quanto a barra de endereço. */
  const proximo = destinoSeguro(searchParams.get(PARAM_PROXIMO));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(proximo, request.url));
    console.error('[auth:callback] exchangeCodeForSession', error.code, error.message);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(proximo, request.url));
    console.error('[auth:callback] verifyOtp', error.code, error.message);
  }

  /**
   * Link inválido ou expirado. Volta para o login com um marcador — e sem eco de
   * nada que veio na URL: refletir `error_description` do provedor na nossa página
   * é XSS refletido de manual.
   */
  const falha = new URL(ROTA_ENTRAR, request.url);
  falha.searchParams.set('erro', 'link');
  return NextResponse.redirect(falha);
}
