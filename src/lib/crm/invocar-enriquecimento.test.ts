import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke, consultar, filtro } = vi.hoisted(() => ({
  invoke: vi.fn(),
  consultar: vi.fn(),
  filtro: vi.fn(),
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ functions: { invoke }, from: () => ({ select: () => ({ eq: filtro }) }) }),
}));
import { conferirEnriquecimento, iniciarEnriquecimento } from './invocar-enriquecimento';

const pedido = { oportunidade_id: '22222222-2222-4222-8222-222222222222' };
describe('Confirmação do enriquecimento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consultar.mockResolvedValue({ data: null, error: null });
    filtro.mockReturnValue({
      order: () => ({ limit: () => ({ abortSignal: () => ({ maybeSingle: consultar }) }) }),
    });
  });
  it('consulta apenas a ficha solicitada, sem invocar a análise', async () => {
    expect(await conferirEnriquecimento(pedido.oportunidade_id)).toBeNull();
    expect(filtro).toHaveBeenCalledWith('oportunidade_id', pedido.oportunidade_id);
    expect(invoke).not.toHaveBeenCalled();
  });
  it.each(['na_fila', 'processando'])('reutiliza análise %s sem novo débito', async (status) => {
    const recibo = { id: '11111111-1111-4111-8111-111111111111', status };
    consultar.mockResolvedValue({ data: recibo, error: null });
    expect(await iniciarEnriquecimento(pedido)).toEqual({ dados: recibo, falha: null });
    expect(invoke).not.toHaveBeenCalled();
  });
  it('falha de leitura impede iniciar às cegas e não expõe erro do banco', async () => {
    consultar.mockResolvedValue({ data: null, error: { message: 'segredo interno' } });
    expect((await iniciarEnriquecimento(pedido)).falha).toContain('Nenhuma nova análise');
    expect(invoke).not.toHaveBeenCalled();
  });
  it('guarda a referência anterior para não confundir resultados antigos', async () => {
    consultar.mockResolvedValue({
      data: { id: '11111111-1111-4111-8111-111111111111', status: 'concluido' },
      error: null,
    });
    invoke.mockRejectedValue(new Error('rede'));
    expect(await iniciarEnriquecimento(pedido)).toMatchObject({
      incerto: true,
      anteriorId: '11111111-1111-4111-8111-111111111111',
    });
    expect(invoke).toHaveBeenCalledOnce();
  });
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
