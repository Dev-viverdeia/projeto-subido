'use client';

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

const ConfirmacaoSchema = z.object({
  id: z.uuid(),
  status: z.enum(['na_fila', 'processando', 'concluido', 'falhou']),
});
const FALHA_INCERTA =
  'Não conseguimos confirmar o início. Confira o andamento na ficha antes de tentar novamente.';

export type PedidoEnriquecimento = {
  oportunidade_id: string;
};

export async function iniciarEnriquecimento(
  pedido: PedidoEnriquecimento,
): Promise<
  | { dados: { id: string; status: string }; falha: null }
  | { dados: null; falha: string; incerto?: boolean }
> {
  const supabase = createClient();
  const resposta = await supabase.functions.invoke<{ id: string; status: string }>(
    'enriquecimento',
    { body: pedido },
  );

  if (resposta.error) {
    // Falha de transporte/servidor não prova que a reserva foi rejeitada.
    const incerto = !resposta.response || resposta.response.status >= 500;
    if (incerto) return { dados: null, falha: FALHA_INCERTA, incerto: true };
    let mensagem = 'Não foi possível iniciar a análise. Tente novamente.';
    try {
      const corpo: unknown = await resposta.response?.json();
      if (typeof corpo === 'object' && corpo !== null && 'erro' in corpo) {
        mensagem = String(corpo.erro);
      }
    } catch {
      /* A plataforma pode devolver corpo vazio em erro de borda. */
    }
    return { dados: null, falha: mensagem, incerto: false };
  }

  const confirmacao = ConfirmacaoSchema.safeParse(resposta.data);
  if (!confirmacao.success) return { dados: null, falha: FALHA_INCERTA, incerto: true };
  return { dados: confirmacao.data, falha: null };
}
