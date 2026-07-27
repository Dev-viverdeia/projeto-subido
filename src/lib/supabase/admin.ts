import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env, serverEnv } from '@/lib/env';
import type { Database } from './types.generated';

/**
 * Cliente de SERVICE ROLE. Ignora RLS por completo.
 *
 * Três camadas impedem que isto chegue ao browser, porque uma só já falhou em
 * outros projetos:
 *   1. `import 'server-only'` — erro de build se um componente de cliente importar.
 *   2. `no-restricted-imports` no eslint.config.mjs — erro de lint antes do build.
 *   3. `serverEnv()` lança se `SUPABASE_SECRET_KEY` não existir, o que é sempre o
 *      caso no bundle do cliente (a variável não tem prefixo NEXT_PUBLIC_).
 *
 * QUANDO USAR: só onde a operação é legitimamente do sistema e não do usuário —
 * webhook de pagamento concedendo acesso, job que emite certificado, backfill.
 * Nunca para "simplificar" uma consulta que a RLS reprovou: se a policy reprovou,
 * ou a policy está errada, ou a consulta está.
 */
export function createAdminClient() {
  const { SUPABASE_SECRET_KEY } = serverEnv();

  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
      /* Sem sessão: este cliente não representa um usuário, representa o sistema.
         Persistir ou renovar token aqui só criaria estado que ninguém lê. */
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
