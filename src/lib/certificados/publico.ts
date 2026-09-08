import 'server-only';

import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import type { Database } from '@/lib/supabase/types.generated';

/** A página e a imagem só leem o registro público. Sem cookies, sessão ou chave admin. */
export const buscarCertificadoPublico = cache(async (codigo: string) => {
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(codigo)) return null;
  const supabase = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
  const { data, error } = await supabase
    .rpc('certificado_publico', { p_codigo: codigo })
    .maybeSingle();
  if (error) throw new Error('Não foi possível verificar o certificado agora.');
  return data;
});
