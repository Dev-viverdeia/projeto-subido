import { beforeEach, describe, expect, it, vi } from 'vitest';

const { retrieve } = vi.hoisted(() => ({ retrieve: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('./stripe', () => ({
  obterStripe: () => ({ prices: { retrieve } }),
  obterConfiguracaoBilling: () => ({
    planos: { starter: { priceId: 'price_starter' }, pro: { priceId: 'price_pro' } },
    pacotes: { essencial: 'price_50', crescimento: 'price_150', escala: 'price_500' },
  }),
}));

import { obterCatalogoBilling } from './catalogo';

const mensal = {
  active: true,
  currency: 'brl',
  unit_amount: 9900,
  type: 'recurring',
  billing_scheme: 'per_unit',
  recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' },
};

beforeEach(() => {
  retrieve.mockReset();
  retrieve.mockImplementation((id: string) =>
    Promise.resolve(
      id === 'price_starter' || id === 'price_pro'
        ? mensal
        : { ...mensal, type: 'one_time', recurring: null },
    ),
  );
});

describe('catálogo pronto para compra', () => {
  it('apresenta apenas preços ativos e compatíveis com cada modalidade', async () => {
    const catalogo = await obterCatalogoBilling();
    expect(catalogo.planos.starter).toMatch(/99,00/);
    expect(catalogo.pacotes.essencial).toMatch(/99,00/);
    expect(catalogo.pronto).toBe(true);
  });

  it.each([
    { ...mensal, active: false },
    { ...mensal, recurring: { interval: 'year', interval_count: 1 } },
    { ...mensal, recurring: { interval: 'month', interval_count: 3 } },
    { ...mensal, type: 'one_time', recurring: null },
    { ...mensal, unit_amount: null },
  ])('não oferece assinatura mensal com preço incompatível: %j', async (preco) => {
    retrieve.mockResolvedValue(preco);
    expect((await obterCatalogoBilling()).planos.starter).toBeNull();
  });

  it('não oferece um pacote avulso com cobrança recorrente', async () => {
    retrieve.mockResolvedValue(mensal);
    expect((await obterCatalogoBilling()).pacotes.essencial).toBeNull();
  });

  it('não confunde valor zero com erro de consulta', async () => {
    retrieve.mockResolvedValue({ ...mensal, unit_amount: 0 });
    expect((await obterCatalogoBilling()).planos.starter).toMatch(/0,00/);
  });

  it('não anuncia catálogo pronto quando nenhuma consulta funcionou', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    retrieve.mockRejectedValue(new Error('stripe_unavailable'));
    expect((await obterCatalogoBilling()).pronto).toBe(false);
    vi.restoreAllMocks();
  });
});
