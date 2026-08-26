import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export const obterAssinaturaAtual = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('billing_assinaturas')
    .select(
      'plano, status, creditos_por_ciclo, cancela_ao_fim_do_periodo, periodo_atual_termina_em, atualizado_em',
    )
    .maybeSingle();

  if (error) {
    console.error('[billing:assinatura:consulta]', error.code, error.message);
    return null;
  }
  return data;
});
