import { beforeEach, describe, expect, it, vi } from 'vitest';
const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({ createClient }));
import { obterUltimaDescobertaConcluida } from './descoberta';
describe('última descoberta concluída', () => {
  const consulta = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  };
  beforeEach(() => {
    vi.clearAllMocks();
    createClient.mockResolvedValue({ from: vi.fn().mockReturnValue(consulta) });
  });
  it('filtra por cliente, tipo e conclusão e ordena pela conclusão mais recente', async () => {
    consulta.maybeSingle.mockResolvedValue({ data: { id: 'reuniao-1' }, error: null });
    expect(await obterUltimaDescobertaConcluida('cliente-1')).toBe('reuniao-1');
    expect(consulta.eq.mock.calls).toEqual([
      ['oportunidade_id', 'cliente-1'],
      ['tipo', 'descoberta'],
      ['status', 'concluida'],
    ]);
    expect(consulta.order.mock.calls).toEqual([
      ['encerrada_em', { ascending: false, nullsFirst: false }],
      ['criada_em', { ascending: false }],
    ]);
    expect(consulta.limit).toHaveBeenCalledWith(1);
  });
  it('não inventa uma reunião quando não há descoberta', async () => {
    consulta.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await obterUltimaDescobertaConcluida('cliente-1')).toBeNull();
  });
});
