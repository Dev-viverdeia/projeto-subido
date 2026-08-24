import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types.generated';

export type MovimentoCredito = Pick<
  Database['public']['Tables']['prospeccao_movimentos']['Row'],
  | 'id'
  | 'tipo'
  | 'movimento'
  | 'saldo_apos'
  | 'descricao'
  | 'criado_em'
  | 'lista_id'
  | 'enriquecimento_id'
  | 'mentoria_id'
>;

export type CarteiraCreditos = {
  saldo: number | null;
  movimentos: MovimentoCredito[];
};

/**
 * A carteira ainda tem nome legado no banco, mas a interface conhece apenas o
 * saldo universal. A RPC também garante que uma conta nova receba sua carteira.
 */
export const obterSaldoCreditos = cache(async (): Promise<number | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('creditos_obter_saldo');
  if (error) return null;
  return data;
});

/**
 * Reúne saldo e extrato sem expor os nomes legados da prospecção para a UI.
 * A RLS da tabela garante que cada profissional veja somente a própria conta.
 */
export async function obterCarteiraCreditos(limite = 12): Promise<CarteiraCreditos> {
  const supabase = await createClient();
  const [saldo, extrato] = await Promise.all([
    obterSaldoCreditos(),
    supabase
      .from('prospeccao_movimentos')
      .select(
        'id, tipo, movimento, saldo_apos, descricao, criado_em, lista_id, enriquecimento_id, mentoria_id',
      )
      .order('criado_em', { ascending: false })
      .limit(Math.min(Math.max(limite, 1), 50)),
  ]);

  if (extrato.error) {
    console.error('[creditos:extrato]', extrato.error.code, extrato.error.message);
  }

  return {
    saldo,
    movimentos: extrato.error ? [] : (extrato.data ?? []),
  };
}
