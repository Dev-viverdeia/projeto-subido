import type { Enums } from '@/lib/supabase/types.generated';

/**
 * Como cada estado do banco se apresenta na tela.
 *
 * Fica num módulo só porque o histórico, a ficha e o estado de geração leem os
 * mesmos quatro valores — três `switch` divergentes é como um estado ganha nome
 * diferente em cada tela.
 *
 * SÓ DOIS PESOS, E O `churn` DO DS FICA DE FORA.
 * A variante `churn` do Pill renderiza `rgb(140,44,44)` — medido. É vermelho de
 * semáforo, que é banido nesta casa; usá-la em `falhou` teria trazido de volta
 * exatamente a cor que a marca não usa.
 *
 * O que o histórico precisa distinguir são duas coisas, não quatro: "dá para
 * abrir" e "ainda precisa de você". `rascunho`, `gerando` e `falhou` são todos o
 * segundo caso — e o card já diz isso no CTA ("Retomar" contra "Abrir projeto").
 * A palavra dentro da pill nomeia qual dos três é; a cor não precisa repetir.
 */
export type StatusBuilder = Enums<'status_builder'>;

export const ROTULO_STATUS: Record<StatusBuilder, string> = {
  rascunho: 'entrevista aberta',
  gerando: 'gerando',
  pronta: 'projeto pronto',
  falhou: 'falhou',
};

export const VARIANTE_STATUS: Record<StatusBuilder, 'default' | 'attn'> = {
  rascunho: 'attn',
  gerando: 'attn',
  pronta: 'default',
  falhou: 'attn',
};

const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/** `28 de jul. de 2026` → `28 JUL 2026`. Mono, curto, sem preposição no meio. */
export function dataCurta(iso: string): string {
  return DATA.format(new Date(iso)).replace(/ de /g, ' ').replace('.', '').toUpperCase();
}
