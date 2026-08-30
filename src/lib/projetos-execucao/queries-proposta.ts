import 'server-only';

import { cache } from 'react';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export const obterExecucaoDaProposta = cache(async (propostaId: string): Promise<string | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projetos_execucao')
    .select('id')
    .eq('proposta_id', propostaId)
    .maybeSingle();

  if (error) throw handleError(error, 'projetos-execucao:por-proposta');
  return data?.id ?? null;
});
