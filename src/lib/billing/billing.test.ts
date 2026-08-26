import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('./stripe', () => ({
  obterConfiguracaoBilling: () => ({
    chave: 'sk_test_qa',
    webhook: 'whsec_qa',
    portal: null,
    planos: {
      starter: { priceId: 'price_starter', creditos: 30 },
      pro: { priceId: 'price_pro', creditos: 100 },
    },
    pacotes: {
      essencial: 'price_essencial',
      crescimento: 'price_crescimento',
      escala: 'price_escala',
    },
  }),
  obterStripe: () => null,
}));

import { pacotePeloId, planoPeloPriceId } from './catalogo';

describe('catálogo de cobrança', () => {
  it('resolve plano e franquia somente por Price ID conhecido', () => {
    expect(planoPeloPriceId('price_pro')).toEqual({ plano: 'pro', creditos: 100 });
    expect(planoPeloPriceId('price_forjado')).toBeNull();
  });

  it('resolve pacotes fechados e recusa quantidade inventada', () => {
    expect(pacotePeloId('crescimento')).toMatchObject({ creditos: 150 });
    expect(pacotePeloId('275-creditos')).toBeNull();
  });
});

describe('fronteira de pagamento', () => {
  const fonteActions = readFileSync(resolve(process.cwd(), 'src/lib/billing/actions.ts'), 'utf8');
  const fonteWebhook = readFileSync(
    resolve(process.cwd(), 'src/app/api/billing/webhook/route.ts'),
    'utf8',
  );

  it('não força meio de pagamento nem habilita imposto sem configuração fiscal', () => {
    expect(fonteActions).not.toContain('payment_method_types');
    expect(fonteActions).not.toContain('automatic_tax');
  });

  it('libera pacote apenas no webhook assinado e idempotente', () => {
    expect(fonteActions).not.toContain('billing_sistema_pagar_pacote');
    expect(fonteWebhook).toContain('constructEventAsync');
    expect(fonteWebhook).toContain('billing_sistema_reservar_evento');
    expect(fonteWebhook).toContain('billing_sistema_pagar_pacote');
  });
});
