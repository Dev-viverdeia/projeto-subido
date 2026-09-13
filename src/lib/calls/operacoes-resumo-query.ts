import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types.generated';
import { handleError } from '@/lib/errors';
import type { OperacaoResumoCall } from './estado-resumo';

/** Leitura com a sessão e RLS do proprietário; nunca entrega payload, erro cru ou lease token. */
export async function obterOperacoesResumo(
  supabase: SupabaseClient<Database>,
  reuniaoId: string,
): Promise<OperacaoResumoCall[] | null> {
  const { data, error } = await supabase
    .from('operacoes_jobs')
    .select('tipo, status, tentativas, disponivel_em, bloqueado_ate, atualizado_em')
    .eq('referencia_tipo', 'call_reuniao')
    .eq('referencia_id', reuniaoId)
    .in('tipo', ['pos_call', 'encerramento_sala'])
    .order('atualizado_em', { ascending: false })
    .limit(20);
  if (error) {
    handleError(error, 'calls:pos-call:operacoes');
    return null;
  }
  return (data ?? []).map((item) => ({
    tipo: item.tipo,
    status: item.status,
    tentativas: item.tentativas,
    disponivelEm: item.disponivel_em,
    bloqueadoAte: item.bloqueado_ate,
    atualizadaEm: item.atualizado_em,
  }));
}
