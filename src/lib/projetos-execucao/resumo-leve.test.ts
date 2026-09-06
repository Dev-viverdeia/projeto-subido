import { beforeEach, describe, expect, it, vi } from 'vitest';

const banco = vi.hoisted(() => ({ select: vi.fn(), linhas: [] as unknown[] }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        select: banco.select.mockImplementation(() => ({
          eq: () => ({
            order: () => ({ limit: () => Promise.resolve({ data: banco.linhas, error: null }) }),
          }),
        })),
      }),
    }),
}));
import { listarProjetosExecucao } from './queries';
import { montarPendenciasEntrega } from './alertas';

describe('Resumo leve de entregas usado no cabeçalho', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    banco.linhas = [
      {
        id: 'projeto-1',
        titulo: 'Atendimento',
        status: 'em_andamento',
        prazo_em: null,
        atualizado_em: '2026-09-06T12:00:00Z',
        cliente: { empresa: 'Clínica QA', contato: null, cargo: null, email: null },
        projeto_tarefas: [
          {
            titulo: 'Validar atendimento',
            ordem: 1,
            status: 'bloqueada',
            cliente_status: 'ajustes',
          },
        ],
        projeto_acoes: [],
        projeto_mudancas_escopo: [],
        projeto_evolucoes: [],
      },
    ];
  });

  it('mantém avisos e dados de progresso sem buscar a proposta inteira', async () => {
    const projetos = await listarProjetosExecucao();
    expect(banco.select).toHaveBeenCalledWith(
      expect.stringContaining('cliente:documento->cliente'),
    );
    expect(banco.select.mock.calls[0]![0]).not.toContain(', documento,');
    expect(projetos[0]).toMatchObject({
      empresa: 'Clínica QA',
      total: 1,
      feitas: 0,
      ajustesSolicitados: 1,
      tarefasBloqueadas: 1,
    });
    expect(montarPendenciasEntrega(projetos)[0]).toMatchObject({
      motivo: 'Ajustes solicitados',
      href: '/entregas/projeto-1',
      empresa: 'Clínica QA',
    });
  });

  it('não monta um aviso a partir de cliente inválido', async () => {
    banco.linhas = [{ cliente: { empresa: '' } }];
    expect(await listarProjetosExecucao()).toEqual([]);
  });
});
