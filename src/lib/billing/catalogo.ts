import 'server-only';

import { cache } from 'react';
import type Stripe from 'stripe';
import { PACOTES_CREDITOS, type PlanoSubido } from '@/lib/planos/acessos';
import { obterConfiguracaoBilling, obterStripe } from './stripe';

export type PlanoCobravel = Extract<PlanoSubido, 'starter' | 'pro'>;
export type PacoteCobravel = (typeof PACOTES_CREDITOS)[number]['id'];

export function planoPeloPriceId(priceId: string | null | undefined): {
  plano: PlanoCobravel;
  creditos: number;
} | null {
  if (!priceId) return null;
  const configuracao = obterConfiguracaoBilling();
  if (!configuracao) return null;

  for (const plano of ['starter', 'pro'] as const) {
    if (configuracao.planos[plano].priceId === priceId) {
      return { plano, creditos: configuracao.planos[plano].creditos };
    }
  }
  return null;
}

export function pacotePeloId(pacoteId: string | null | undefined) {
  return PACOTES_CREDITOS.find((pacote) => pacote.id === pacoteId) ?? null;
}

function precoApresentavel(preco: Stripe.Price, modalidade: 'mensal' | 'avulso'): string | null {
  if (!preco.active || preco.unit_amount === null || preco.billing_scheme !== 'per_unit')
    return null;
  if (
    modalidade === 'mensal' &&
    (preco.type !== 'recurring' ||
      preco.recurring?.interval !== 'month' ||
      preco.recurring.interval_count !== 1 ||
      preco.recurring.usage_type !== 'licensed')
  )
    return null;
  if (modalidade === 'avulso' && preco.type !== 'one_time') return null;
  // O catálogo comercial desta plataforma é em reais; não supor centavos para outras moedas.
  if (preco.currency !== 'brl') return null;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: preco.currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(preco.unit_amount / 100);
}

export async function buscarPreco(
  priceId: string | null,
  modalidade: 'mensal' | 'avulso',
): Promise<string | null> {
  const stripe = obterStripe();
  if (!stripe || !priceId) return null;
  try {
    return precoApresentavel(
      await stripe.prices.retrieve(priceId, {}, { timeout: 8_000, maxNetworkRetries: 1 }),
      modalidade,
    );
  } catch (causa) {
    console.error('[billing:catalogo:preco]', causa instanceof Error ? causa.message : causa);
    return null;
  }
}

export const obterCatalogoBilling = cache(async () => {
  const configuracao = obterConfiguracaoBilling();
  if (!configuracao) {
    return {
      pronto: false,
      planos: { starter: null, pro: null },
      pacotes: { essencial: null, crescimento: null, escala: null },
    } as const;
  }

  const [starter, pro, essencial, crescimento, escala] = await Promise.all([
    buscarPreco(configuracao.planos.starter.priceId, 'mensal'),
    buscarPreco(configuracao.planos.pro.priceId, 'mensal'),
    buscarPreco(configuracao.pacotes.essencial, 'avulso'),
    buscarPreco(configuracao.pacotes.crescimento, 'avulso'),
    buscarPreco(configuracao.pacotes.escala, 'avulso'),
  ]);

  return {
    pronto: [starter, pro, essencial, crescimento, escala].some((preco) => preco !== null),
    planos: { starter, pro },
    pacotes: { essencial, crescimento, escala },
  } as const;
});
