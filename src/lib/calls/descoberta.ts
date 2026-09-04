import 'server-only';

import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export async function oportunidadeTemDescobertaConcluida(oportunidadeId: string): Promise<boolean> {
  return Boolean(await obterUltimaDescobertaConcluida(oportunidadeId));
}

export async function obterUltimaDescobertaConcluida(
  oportunidadeId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('calls_reunioes')
    .select('id')
    .eq('oportunidade_id', oportunidadeId)
    .eq('tipo', 'descoberta')
    .eq('status', 'concluida')
    .order('encerrada_em', { ascending: false, nullsFirst: false })
    .order('criada_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw handleError(error, 'calls:descoberta-concluida');
  return data?.id ?? null;
}

export async function listarOportunidadesComDescobertaConcluida(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('calls_reunioes')
    .select('oportunidade_id')
    .eq('tipo', 'descoberta')
    .eq('status', 'concluida')
    .limit(1_000);

  if (error) throw handleError(error, 'calls:listar-descobertas');
  return new Set((data ?? []).map((item) => item.oportunidade_id));
}
