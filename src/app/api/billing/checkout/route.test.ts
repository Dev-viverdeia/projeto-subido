import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  retrieve: vi.fn(),
  maybeSingle: vi.fn(),
  refreshSession: vi.fn(),
  eq: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/billing/stripe', () => ({
  obterStripe: () => ({ checkout: { sessions: { retrieve: mocks.retrieve } } }),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => {
    const consulta = {
      select: () => consulta,
      eq: (campo: string, valor: string) => {
        mocks.eq(campo, valor);
        return consulta;
      },
      maybeSingle: mocks.maybeSingle,
    };
    return Promise.resolve({
      auth: { getUser: mocks.getUser, refreshSession: mocks.refreshSession },
      from: () => consulta,
    });
  },
}));
import { GET } from './route';
const request = () =>
  new Request('https://subido.viverdeia.ai/api/billing/checkout?session_id=cs_test_segura');
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'usuario_a' } }, error: null });
  mocks.retrieve.mockResolvedValue({
    id: 'cs_test_segura',
    mode: 'payment',
    status: 'complete',
    payment_status: 'paid',
    client_reference_id: 'usuario_a',
    metadata: { usuario_id: 'usuario_a' },
  });
  mocks.maybeSingle.mockResolvedValue({ data: { status: 'pago' }, error: null });
  mocks.refreshSession.mockResolvedValue({ error: null });
});
it('requer sessão autenticada antes de consultar a Stripe', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  expect((await GET(request())).status).toBe(401);
  expect(mocks.retrieve).not.toHaveBeenCalled();
});
it('rejeita identificador inválido antes de consultar o provedor', async () => {
  expect(
    (await GET(new Request('https://site.test/api/billing/checkout?session_id=forjado'))).status,
  ).toBe(400);
  expect(mocks.retrieve).not.toHaveBeenCalled();
});
it('não revela nem confirma o checkout de outra conta', async () => {
  mocks.retrieve.mockResolvedValue({
    metadata: { usuario_id: 'usuario_b' },
    client_reference_id: 'usuario_b',
  });
  const response = await GET(request());
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ estado: 'nao_encontrado' });
  expect(mocks.maybeSingle).not.toHaveBeenCalled();
});
it('pagamento recebido mas ainda sem créditos no banco não aparece concluído', async () => {
  mocks.maybeSingle.mockResolvedValue({ data: { status: 'pendente' }, error: null });
  expect(await (await GET(request())).json()).toEqual({ estado: 'atualizando' });
});
it('confirma pacote somente depois do registro pago do próprio usuário', async () => {
  const response = await GET(request());
  expect(await response.json()).toEqual({ estado: 'confirmado' });
  expect(mocks.eq).toHaveBeenCalledWith('usuario_id', 'usuario_a');
  expect(mocks.eq).toHaveBeenCalledWith('stripe_checkout_session_id', 'cs_test_segura');
  expect(response.headers.get('Cache-Control')).toContain('no-store');
});
it('falha de banco nunca vira confirmação ou ausência', async () => {
  mocks.maybeSingle.mockResolvedValue({ data: null, error: { code: '08006' } });
  expect((await GET(request())).status).toBe(503);
});
it.each(['reembolsado', 'falhou'])(
  'mostra o estado final %s sem reativar o pagamento',
  async (status) => {
    mocks.maybeSingle.mockResolvedValue({ data: { status }, error: null });
    expect(await (await GET(request())).json()).toEqual({ estado: status });
  },
);
it('não confirma assinatura só porque o checkout encerrou', async () => {
  mocks.retrieve.mockResolvedValue({
    mode: 'subscription',
    status: 'complete',
    payment_status: 'paid',
    subscription: 'sub_abc',
    metadata: { usuario_id: 'usuario_a' },
    client_reference_id: 'usuario_a',
  });
  mocks.maybeSingle.mockResolvedValue({ data: { status: 'incomplete' }, error: null });
  expect(await (await GET(request())).json()).toEqual({ estado: 'atualizando' });
  expect(mocks.eq).toHaveBeenCalledWith('stripe_subscription_id', 'sub_abc');
  expect(mocks.refreshSession).not.toHaveBeenCalled();
});
it('atualiza a sessão após ativação da assinatura para refletir o novo acesso', async () => {
  mocks.retrieve.mockResolvedValue({
    mode: 'subscription',
    status: 'complete',
    payment_status: 'paid',
    subscription: 'sub_abc',
    metadata: { usuario_id: 'usuario_a' },
    client_reference_id: 'usuario_a',
  });
  mocks.maybeSingle.mockResolvedValue({ data: { status: 'active' }, error: null });
  expect(await (await GET(request())).json()).toEqual({ estado: 'confirmado' });
  expect(mocks.refreshSession).toHaveBeenCalledOnce();
});
