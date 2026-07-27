import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import type { Database } from './types.generated';

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 *
 * É UMA FUNÇÃO, NUNCA UM SINGLETON — e isso não é estilo.
 * `cookies()` é escopado ao request. Um módulo que fizesse
 * `export const supabase = createServerClient(...)` capturaria o cookie store do
 * PRIMEIRO request que importasse o módulo e o reusaria em todos os outros: no
 * Node de produção, com o processo vivo entre requests, isso serve a sessão de um
 * usuário para outro. É um vazamento de sessão silencioso, que não aparece em dev
 * (um usuário só) nem em nenhum teste que não rode dois logins concorrentes.
 *
 * IMPORTANTE: nunca chame isto na árvore de `(marketing)`. Ler cookies tira a rota
 * do shell estático e passa a cobrar um cold start de Node por clique de anúncio.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            /**
             * Server Components não podem escrever cookies — o Next lança aqui.
             * Engolir é CORRETO neste ponto específico, e só porque o proxy.ts já
             * renovou a sessão antes desta renderização. Se o matcher do proxy
             * deixar de cobrir uma rota autenticada, o sintoma será logout
             * aleatório: o token expira, ninguém consegue gravar o novo, e este
             * catch esconde a causa. O matcher e este catch são um par.
             */
          }
        },
      },
    },
  );
}
