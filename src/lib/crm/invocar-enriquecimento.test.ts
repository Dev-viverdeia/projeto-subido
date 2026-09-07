import { beforeEach, describe, expect, it, vi } from 'vitest';

const invoke = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({ functions: { invoke } }) }));
import { iniciarEnriquecimento } from './invocar-enriquecimento';

const pedido = { oportunidade_id: '22222222-2222-4222-8222-222222222222' };
describe('Confirmação do enriquecimento', () => {
  beforeEach(() => vi.clearAllMocks());
  it('trata resposta perdida como incerta, sem afirmar que pode cobrar outra vez', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: new Error('Failed to fetch'),
      response: undefined,
    });
    expect(await iniciarEnriquecimento(pedido)).toMatchObject({ dados: null, incerto: true });
  });
  it('não aceita corpo vazio como uma análise confirmada', async () => {
    invoke.mockResolvedValue({ data: null, error: null });
    expect(await iniciarEnriquecimento(pedido)).toMatchObject({ dados: null, incerto: true });
  });
  it('preserva uma recusa explícita por saldo insuficiente', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: new Error('HTTP'),
      response: new Response(JSON.stringify({ erro: 'Saldo insuficiente' }), { status: 402 }),
    });
    expect(await iniciarEnriquecimento(pedido)).toMatchObject({
      dados: null,
      falha: 'Saldo insuficiente',
      incerto: false,
    });
  });
});
