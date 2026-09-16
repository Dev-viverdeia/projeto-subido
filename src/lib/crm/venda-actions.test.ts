import { beforeEach, describe, expect, it, vi } from 'vitest';
const { acesso, rpc, revalidatePath } = vi.hoisted(() => ({
  acesso: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/planos/server', () => ({ obterAcessoRecurso: acesso }));
vi.mock('@/lib/supabase/server', () => ({ createClient: () => ({ rpc }) }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/errors', () => ({ handleError: () => new Error('Não foi possível salvar.') }));
import { salvarVendaFicha } from './venda-actions';
import { valorPrevistoCentavos, valorPrevistoCampo } from './venda-schema';

const entrada = {
  oportunidade: '11111111-1111-4111-8111-111111111111',
  revisao: 2,
  titulo: ' Projeto IA ',
  valor: 'R$ 12.500,50',
};
beforeEach(() => {
  vi.clearAllMocks();
  acesso.mockResolvedValue({ permitido: true });
  rpc.mockResolvedValue({ error: null });
});

describe('editar venda', () => {
  it('grava só título e valor, sem outra operação, e revalida ficha, kanban e métricas', async () => {
    expect(await salvarVendaFicha(entrada)).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledExactlyOnceWith('crm_editar_venda', {
      p_oportunidade: entrada.oportunidade,
      p_revisao: 2,
      p_titulo: 'Projeto IA',
      p_valor_centavos: 1250050,
    });
    for (const caminho of ['/crm', '/vendas', '/metricas'])
      expect(revalidatePath).toHaveBeenCalledWith(caminho, 'layout');
  });
  it.each(['sessao', 'plano'])('exige acesso atual: %s', async (motivo) => {
    acesso.mockResolvedValue({ permitido: false, motivo });
    expect((await salvarVendaFicha(entrada)).ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each([
    { titulo: '' },
    { titulo: 'A\nB' },
    { titulo: 'x'.repeat(181) },
    { oportunidade: 'id' },
    { revisao: -1 },
    { valor: '-10' },
    { valor: '12.50' },
  ])('rejeita %j', async (mudanca) => {
    expect((await salvarVendaFicha({ ...entrada, ...mudanca })).ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each([
    ['', undefined],
    ['0', 0],
  ] as const)('diferencia %s de zero', async (valor, esperado) => {
    await salvarVendaFicha({ ...entrada, valor });
    expect(rpc).toHaveBeenCalledExactlyOnceWith(
      'crm_editar_venda',
      expect.objectContaining({ p_valor_centavos: esperado }),
    );
  });
  it('informa conflito sem erro interno e sem confirmar gravação', async () => {
    rpc.mockResolvedValue({ error: { code: '40001', message: 'interno' } });
    expect(await salvarVendaFicha(entrada)).toMatchObject({ ok: false, conflito: true });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it('trata falha sem expor dados internos', async () => {
    rpc.mockResolvedValue({ error: { code: 'P0002', message: 'interno' } });
    expect(await salvarVendaFicha(entrada)).toEqual({
      ok: false,
      erro: 'Não foi possível salvar.',
    });
  });
});
describe('BRL sem arredondamento silencioso', () => {
  it.each([
    ['', null],
    [' ', null],
    ['0', 0],
    ['0,01', 1],
    ['12,5', 1250],
    ['12500', 1250000],
    ['12.500,50', 1250050],
    ['R$ 12.500,50', 1250050],
    ['1.000.000.000,00', 100000000000],
  ] as const)('%s → %s', (texto, valor) => expect(valorPrevistoCentavos(texto)).toBe(valor));
  it.each([
    'R$',
    '-1',
    '+5',
    '1e6',
    'Infinity',
    'NaN',
    '12.50',
    '1,234',
    '1,000.00',
    '1..000',
    'R$ 1 000',
    '1.000.000.000,01',
    '999999999999999999999',
  ])('rejeita %s', (texto) => expect(valorPrevistoCentavos(texto)).toBeUndefined());
  it.each([null, 0, 1, 1250050, 100000000000])('mantém valor ao reabrir %s', (valor) =>
    expect(valorPrevistoCentavos(valorPrevistoCampo(valor))).toBe(valor),
  );
});
