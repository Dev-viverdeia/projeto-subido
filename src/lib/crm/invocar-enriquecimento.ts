'use client';

import { createClient } from '@/lib/supabase/client';

export type PedidoEnriquecimento = {
  oportunidade_id: string;
};

export async function iniciarEnriquecimento(
  pedido: PedidoEnriquecimento,
): Promise<
  { dados: { id: string; status: string }; falha: null } | { dados: null; falha: string }
> {
  const supabase = createClient();
  const resposta = await supabase.functions.invoke<{ id: string; status: string }>(
    'enriquecimento',
    { body: pedido },
  );

  if (resposta.error) {
    let mensagem = 'Não foi possível iniciar a análise. Tente novamente.';
    try {
      const corpo: unknown = await resposta.response?.json();
      if (typeof corpo === 'object' && corpo !== null && 'erro' in corpo) {
        mensagem = String(corpo.erro);
      }
    } catch {
      /* A plataforma pode devolver corpo vazio em erro de borda. */
    }
    return { dados: null, falha: mensagem };
  }

  return { dados: resposta.data as { id: string; status: string }, falha: null };
}
