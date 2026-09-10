'use client';

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

const ConfirmacaoSchema = z.object({
  id: z.uuid(),
  status: z.enum(['na_fila', 'processando', 'concluido', 'falhou']),
});
const FALHA_INCERTA =
  'Não conseguimos confirmar o início. Confira o andamento na ficha antes de tentar novamente.';

export type ReciboEnriquecimento = z.infer<typeof ConfirmacaoSchema>;

/** Leitura com a sessão e RLS. Conferir nunca chama o worker nem reserva créditos. */
export async function conferirEnriquecimento(
  oportunidadeId: string,
): Promise<ReciboEnriquecimento | null> {
  const { data, error } = await createClient()
    .from('crm_enriquecimentos')
    .select('id, status')
    .eq('oportunidade_id', oportunidadeId)
    .order('solicitado_em', { ascending: false })
    .limit(1)
    .abortSignal(AbortSignal.timeout(12_000))
    .maybeSingle();
  if (error) throw new Error('consulta-indisponivel');
  return data === null ? null : ConfirmacaoSchema.parse(data);
}

export type PedidoEnriquecimento = {
  oportunidade_id: string;
};

export async function iniciarEnriquecimento(
  pedido: PedidoEnriquecimento,
): Promise<
  | { dados: { id: string; status: string }; falha: null }
  | { dados: null; falha: string; incerto?: boolean; anteriorId?: string | null }
> {
  let anterior: ReciboEnriquecimento | null;
  try {
    anterior = await conferirEnriquecimento(pedido.oportunidade_id);
  } catch {
    return {
      dados: null,
      falha: 'Não foi possível conferir a ficha. Nenhuma nova análise foi solicitada.',
    };
  }
  if (anterior?.status === 'na_fila' || anterior?.status === 'processando')
    return { dados: anterior, falha: null };
  const incerta = {
    dados: null,
    falha: FALHA_INCERTA,
    incerto: true,
    anteriorId: anterior?.id ?? null,
  } as const;
  const supabase = createClient();
  let resposta;
  try {
    resposta = await supabase.functions.invoke<{ id: string; status: string }>('enriquecimento', {
      body: pedido,
      timeout: 20_000,
    });
  } catch {
    return incerta;
  }

  if (resposta.error) {
    // Falha de transporte/servidor não prova que a reserva foi rejeitada.
    const incerto = !resposta.response || resposta.response.status >= 500;
    if (incerto) return incerta;
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
  if (!confirmacao.success) return incerta;
  return { dados: confirmacao.data, falha: null };
}
