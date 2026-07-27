'use client';

import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import type { Database } from './types.generated';

/**
 * Cliente Supabase do browser.
 *
 * Aqui o singleton é CORRETO, ao contrário do server.ts: no browser existe um
 * usuário só e um armazenamento de cookie só. O `createBrowserClient` já mantém a
 * instância internamente (`isSingleton` default), então chamadas repetidas
 * devolvem o mesmo cliente — o que importa, porque cada instância nova registraria
 * outro listener de `onAuthStateChange` e o refresh de token passaria a disparar N
 * vezes.
 *
 * Use só para o que precisa acontecer no cliente: `signInWithPassword`,
 * `signOut`, `onAuthStateChange`. Leitura de dados no load é RSC — ver CLAUDE.md.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
