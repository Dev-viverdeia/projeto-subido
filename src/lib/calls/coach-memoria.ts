import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleError } from '@/lib/errors';
import type { Database } from '@/lib/supabase/types.generated';
import { orientacaoVigente } from './coach-orientacao';

const CAMPOS =
  'id, categoria, titulo, sugestao, metodologia, trecho_gatilho, prioridade, confianca, status, criada_em';

export async function obterMemoriaCoach(
  supabase: SupabaseClient<Database>,
  dono: string,
  reuniaoId: string,
) {
  const consulta = () =>
    supabase
      .from('calls_coach_sugestoes')
      .select(CAMPOS)
      .eq('dono', dono)
      .eq('reuniao_id', reuniaoId)
      .order('criada_em', { ascending: false });
  const [ultima, anteriores] = await Promise.all([
    consulta().limit(1).maybeSingle(),
    consulta().neq('status', 'dispensada').limit(8),
  ]);
  if (ultima.error || anteriores.error)
    throw handleError(ultima.error ?? anteriores.error, 'calls:coach:memoria');
  return {
    ultima: ultima.data,
    historico: anteriores.data ?? [],
    vigente: orientacaoVigente(ultima.data),
  };
}
