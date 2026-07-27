import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { ROTA_ENTRAR, PARAM_PROXIMO } from '@/lib/routes';
import type { Database } from './types.generated';

/**
 * Renova a sessão e barra quem não está autenticado.
 *
 * Chamado só pelo `src/proxy.ts`, e só nas rotas que o matcher de lá cobre.
 *
 * A DANÇA DOS COOKIES não é cerimônia. Quando o Supabase rotaciona o refresh token
 * ele precisa que o token novo chegue em DOIS lugares: no `request`, para que a
 * renderização desta mesma requisição já use o token novo; e no `response`, para
 * que o browser o guarde. Escrever só num dos dois produz o bug clássico — o
 * usuário é deslogado a cada poucos minutos, sem erro em lugar nenhum.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  /**
   * NÃO INSIRA CÓDIGO ENTRE O createServerClient ACIMA E ESTA CHAMADA.
   * Qualquer `await` no meio abre uma janela em que a sessão ainda não foi
   * renovada, e o bug resultante é intermitente por definição.
   *
   * `getClaims()` e não `getSession()`: com chaves de assinatura assimétricas o
   * claims é verificado localmente, sem ida ao servidor de auth. `getSession()`
   * devolve o que está no cookie sem validar — o que num proxy é o mesmo que
   * confiar no cliente.
   */
  const { data } = await supabase.auth.getClaims();

  if (!data) {
    const destino = request.nextUrl.clone();
    destino.pathname = ROTA_ENTRAR;
    destino.search = '';
    /* Para devolver a pessoa ao lugar que ela pediu depois do login. Só o pathname:
       ver a validação em @/lib/routes — querystring de origem pode carregar token. */
    destino.searchParams.set(PARAM_PROXIMO, request.nextUrl.pathname);

    const redirect = NextResponse.redirect(destino);
    /* Os cookies renovados precisam sobreviver ao redirect. Sem este laço, um token
       que acabou de ser rotacionado é descartado e a próxima requisição repete o
       ciclo — um loop de redirect que só aparece quando o token expira. */
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  return response;
}
