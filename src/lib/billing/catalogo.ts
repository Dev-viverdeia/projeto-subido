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

function precoApresentavel(preco: Stripe.Price | null): string | null {
  if (!preco?.unit_amount || !preco.currency) return null;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: preco.currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(preco.unit_amount / 100);
}

async function buscarPreco(priceId: string | null): Promise<string | null> {
  const stripe = obterStripe();
  if (!stripe || !priceId) return null;
  try {
    return precoApresentavel(await stripe.prices.retrieve(priceId));
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
    buscarPreco(configuracao.planos.starter.priceId),
    buscarPreco(configuracao.planos.pro.priceId),
    buscarPreco(configuracao.pacotes.essencial),
    buscarPreco(configuracao.pacotes.crescimento),
    buscarPreco(configuracao.pacotes.escala),
  ]);

  return {
    pronto: true,
    planos: { starter, pro },
    pacotes: { essencial, crescimento, escala },
  } as const;
});
