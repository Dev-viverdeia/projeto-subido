import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { rpc, select, consultarIds, createClient } = vi.hoisted(() => ({
  rpc: vi.fn(),
  select: vi.fn(),
  consultarIds: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient }));
vi.mock('@/lib/errors', () => ({ handleError: (e: Error) => e }));
import { listarPaginaAgenda, listarRetornosAgenda } from './agenda-queries';

describe('Leitura da agenda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClient.mockResolvedValue({ rpc, from: () => ({ select }) });
    select.mockReturnValue({ in: consultarIds });
  });
  it('retorna 12 linhas, usa a 13ª somente para sinalizar continuidade', async () => {
    rpc.mockResolvedValue({
      data: Array.from({ length: 13 }, (_, i) => ({
        id: `id-${i}`,
        agendada_para: '2026-09-14T17:00:00.123456+00:00',
        titulo: 'Conversa',
        empresa: 'Cliente arquivado',
        contato: null,
        oportunidade: 'IA',
        google_sync_status: 'sincronizado',
      })),
      error: null,
    });
    const pagina = await listarPaginaAgenda(
      { visao: 'historico', busca: 'Cliente' },
      new Date('2026-09-14T18:00:00Z'),
    );
    expect(pagina.reunioes).toHaveLength(12);
    expect(pagina.reunioes[0]?.empresa).toBe('Cliente arquivado');
    expect(pagina.proximoCursor).toEqual({ data: '2026-09-14T17:00:00.123456+00:00', id: 'id-11' });
    expect(rpc).toHaveBeenCalledWith(
      'calls_listar_agenda',
      expect.objectContaining({
        p_visao: 'historico',
        p_busca: 'Cliente',
        p_agora: '2026-09-14T18:00:00.000Z',
      }),
    );
  });
  it('não mascara falha como uma agenda vazia', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('sem conexão') });
    await expect(listarPaginaAgenda({ visao: 'proximas', busca: '' }, new Date())).rejects.toThrow(
      'sem conexão',
    );
  });
  it('não faz consulta de retorno sem ID e limita retornos ao necessário', async () => {
    expect(await listarRetornosAgenda([])).toEqual([]);
    expect(createClient).not.toHaveBeenCalled();
    consultarIds.mockResolvedValue({ data: [], error: null });
    await listarRetornosAgenda(['a', 'a', 'b', 'c']);
    expect(consultarIds).toHaveBeenCalledWith('id', ['a', 'b']);
    expect(select).toHaveBeenCalledWith(expect.stringContaining('calls_reunioes_empresa_fk'));
  });
});
