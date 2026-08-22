import 'server-only';

import { createClient } from '@/lib/supabase/server';

/**
 * A carteira ainda tem nome legado no banco, mas a interface conhece apenas o
 * saldo universal. A RPC também garante que uma conta nova receba sua carteira.
 */
export async function obterSaldoCreditos(): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('creditos_obter_saldo');
  if (error) return null;
  return data;
}
