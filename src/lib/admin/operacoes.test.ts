// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
const m = vi.hoisted(() => ({ ehAdmin: vi.fn(), client: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/papeis', () => ({ ehAdmin: m.ehAdmin }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: m.client }));
vi.mock('@/lib/operacoes/saude', () => ({
  avaliarSaudeOperacional: () => ({ nivel: 'saudavel', alertas: [] }),
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('404');
  },
}));
import { obterPainelOperacoes } from './operacoes';
import { atendimentoExemplo } from '@/components/operacoes/fixture';
beforeEach(() => vi.resetAllMocks());
describe('acesso ao painel', () => {
  it('nega antes de consultar o banco privilegiado', async () => {
    m.ehAdmin.mockResolvedValue(false);
    await expect(obterPainelOperacoes()).rejects.toThrow('404');
    expect(m.client).not.toHaveBeenCalled();
  });
  it.each(['indisponivel', 'invalido', 'rejeitado', 'valido'])(
    'preserva o painel existente com resumo de atendimento %s',
    async (cenario) => {
      m.ehAdmin.mockResolvedValue(true);
      const fixture = atendimentoExemplo();
      const consulta = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      m.client.mockReturnValue({
        from: vi.fn(() => consulta),
        rpc: vi.fn((nome: string) =>
          nome === 'operacoes_sistema_resumo'
            ? { single: () => Promise.resolve({ data: {}, error: null }) }
            : cenario === 'rejeitado'
              ? Promise.reject(new Error('timeout'))
              : Promise.resolve({
                  error: cenario === 'indisponivel' ? { message: 'indisponivel' } : null,
                  data: cenario === 'invalido' ? { ia: { ativas: 0 } } : fixture,
                }),
        ),
      });
      const resultado = await obterPainelOperacoes();
      expect(resultado.operacoes).toEqual([]);
      expect(resultado.atendimento).toEqual(cenario === 'valido' ? fixture : null);
    },
  );
});
