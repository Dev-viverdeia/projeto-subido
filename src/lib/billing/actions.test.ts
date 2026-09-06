import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  createCheckout: vi.fn(),
  createPortal: vi.fn(),
  price: vi.fn(),
  inStatus: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mocks.getUser },
      from: () => ({
        select: () => ({
          maybeSingle: mocks.maybeSingle,
          in: (_campo: string, status: string[]) => {
            mocks.inStatus(status);
            return { maybeSingle: mocks.maybeSingle };
          },
        }),
      }),
    }),
}));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ rpc: mocks.rpc }) }));
vi.mock('./stripe', () => ({
  obterStripe: () => ({
    prices: { retrieve: mocks.price },
    checkout: { sessions: { create: mocks.createCheckout } },
    billingPortal: { sessions: { create: mocks.createPortal } },
  }),
  obterConfiguracaoBilling: () => ({
    planos: { starter: { priceId: 'price_starter' }, pro: { priceId: 'price_pro' } },
    pacotes: { essencial: 'price_50', crescimento: 'price_150', escala: 'price_500' },
  }),
  identificadorIntegracao: () => 'subido_test',
}));

import { abrirPortalCobranca, comprarPacoteCreditos, iniciarAssinatura } from './actions';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'user_test', email: 'qa@example.test' } },
    error: null,
  });
  mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
  mocks.createCheckout.mockResolvedValue({
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/test',
  });
  mocks.rpc.mockResolvedValue({ error: null });
  mocks.price.mockResolvedValue({
    active: true,
    currency: 'brl',
    unit_amount: 9900,
    type: 'recurring',
    billing_scheme: 'per_unit',
    recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' },
  });
});

function formulario(campo: string, valor: string) {
  const form = new FormData();
  form.set(campo, valor);
  return form;
}

it.each([
  ['assinatura', () => iniciarAssinatura(formulario('plano', 'pro'))],
  ['creditos', () => comprarPacoteCreditos(formulario('pacote', 'essencial'))],
  ['assinatura', () => abrirPortalCobranca()],
] as const)('sessão expirada volta ao login sem perder o destino %s', async (pagina, action) => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  await expect(action()).rejects.toThrow(`REDIRECT:/entrar?proximo=/conta/${pagina}`);
  expect(mocks.createCheckout).not.toHaveBeenCalled();
  expect(mocks.createPortal).not.toHaveBeenCalled();
});

it('falha ao consultar cobrança não permite criar uma segunda assinatura', async () => {
  mocks.maybeSingle.mockResolvedValue({ data: null, error: { code: '08006' } });
  await expect(iniciarAssinatura(formulario('plano', 'pro'))).rejects.toThrow(
    'checkout=indisponivel',
  );
  expect(mocks.createCheckout).not.toHaveBeenCalled();
});

it('consulta também assinaturas pendentes, pausadas e sem pagamento para não duplicar', async () => {
  await expect(iniciarAssinatura(formulario('plano', 'pro'))).rejects.toThrow(
    'REDIRECT:https://checkout',
  );
  expect(mocks.inStatus).toHaveBeenCalledWith(
    expect.arrayContaining(['incomplete', 'unpaid', 'paused']),
  );
});

it('revalida o preço na ação antes de abrir o pagamento', async () => {
  mocks.price.mockResolvedValue({ active: false });
  await expect(iniciarAssinatura(formulario('plano', 'pro'))).rejects.toThrow(
    'checkout=indisponivel',
  );
  expect(mocks.createCheckout).not.toHaveBeenCalled();
});

it('inclui a sessão real no retorno, sem confiar no parâmetro sucesso como prova', async () => {
  await expect(iniciarAssinatura(formulario('plano', 'pro'))).rejects.toThrow(
    'REDIRECT:https://checkout',
  );
  expect(mocks.createCheckout).toHaveBeenCalledWith(
    expect.objectContaining({
      success_url: expect.stringContaining('session_id={CHECKOUT_SESSION_ID}') as unknown,
    }),
    expect.anything(),
  );
  expect(mocks.rpc).not.toHaveBeenCalled();
});
