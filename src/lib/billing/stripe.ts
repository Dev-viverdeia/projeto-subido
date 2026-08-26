import 'server-only';

import Stripe from 'stripe';
import { billingEnv } from '@/lib/env';

let cliente: Stripe | null = null;

export function obterConfiguracaoBilling() {
  return billingEnv();
}

export function obterStripe(): Stripe | null {
  const configuracao = billingEnv();
  if (!configuracao) return null;
  if (!cliente) {
    cliente = new Stripe(configuracao.chave, {
      apiVersion: '2026-07-29.dahlia',
      appInfo: { name: 'Viver de IA Subido', version: '1.0.0' },
      maxNetworkRetries: 2,
    });
  }
  return cliente;
}

export function identificadorIntegracao(prefixo: string): string {
  const sufixo = crypto.randomUUID().replaceAll('-', '').slice(0, 8);
  return `subido_${prefixo}_${sufixo}`;
}
