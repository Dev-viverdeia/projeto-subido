import { describe, expect, it, vi } from 'vitest';

const { from, resultados, consultas } = vi.hoisted(() => {
  const resultados: Record<string, unknown[]> = {};
  const consultas: Record<
    string,
    {
      select: ReturnType<typeof vi.fn>;
      order: ReturnType<typeof vi.fn>;
      limit: ReturnType<typeof vi.fn>;
    }
  > = {};
  const from = vi.fn((tabela: string) => {
    const consulta = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve({ data: resultados[tabela] ?? [], error: null }).then(resolve),
    };
    consultas[tabela] = consulta;
    return consulta;
  });
  return { from, resultados, consultas };
});
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve({ from }) }));

import { listarPipeline } from './pipeline-queries';

describe('Dados do kanban', () => {
  it('busca uma proposta por oportunidade na mesma consulta, incluindo vendas sem documento', async () => {
    const linha = {
      id: 'venda-1',
      titulo: 'Atendimento',
      etapa: 'descoberta',
      empresa_id: 'empresa-1',
      contato_principal_id: null,
      valor_centavos: 1500000,
      proxima_acao: null,
      proxima_acao_em: null,
      ganha_em: null,
      perdida_em: null,
      motivo_perda: null,
      atualizado_em: '2026-09-08',
      criado_em: '2026-09-01',
      empresa: { nome: 'Clínica Aurora', dominio: null, enriquecido_em: null },
      contato: null,
      propostas: [{ id: 'proposta-1', status: 'rascunho' }],
    };
    resultados.crm_oportunidades = [linha, { ...linha, id: 'venda-2', propostas: [] }];
    const pipeline = await listarPipeline();
    expect(pipeline[0]?.propostaRecente).toEqual({ id: 'proposta-1', status: 'rascunho' });
    expect(pipeline[1]?.propostaRecente).toBeNull();
    expect(consultas.crm_oportunidades?.select).toHaveBeenCalledWith(
      expect.stringContaining('propostas!propostas_oportunidade_fk(id, status)'),
    );
    expect(consultas.crm_oportunidades?.limit).toHaveBeenCalledWith(1, {
      referencedTable: 'propostas',
    });
    expect(consultas.crm_oportunidades?.order).toHaveBeenCalledWith('atualizado_em', {
      referencedTable: 'propostas',
      ascending: false,
    });
    expect(from).not.toHaveBeenCalledWith('propostas');
  });
});
