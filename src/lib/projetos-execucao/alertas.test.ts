import { describe, expect, it } from 'vitest';
import type { ResumoProjetoExecucao } from './queries';
import { montarPendenciasEntrega } from './alertas';

const AGORA = new Date('2026-08-28T12:00:00.000Z');
const BASE: ResumoProjetoExecucao = {
  id: '11111111-1111-4111-8111-111111111111',
  titulo: 'Atendimento com IA',
  empresa: 'Clínica Horizonte',
  status: 'em_execucao',
  prazoEm: '2026-09-18T12:00:00.000Z',
  atualizadoEm: '2026-08-26T12:00:00.000Z',
  feitas: 4,
  total: 10,
  proximaTarefa: 'Validar o fluxo',
  proximaAcaoPrazoEm: null,
  tarefasBloqueadas: 0,
  validacoesAguardando: 0,
  ajustesSolicitados: 0,
};

describe('alertas das entregas', () => {
  it('mostra apenas situações que pedem atenção', () => {
    const noPrazo = { ...BASE, id: 'no-prazo' };
    const pausado = { ...BASE, id: 'pausado', status: 'pausado' as const };
    const aguardando = { ...BASE, id: 'aguardando', validacoesAguardando: 1 };

    expect(montarPendenciasEntrega([noPrazo, pausado, aguardando], AGORA)).toEqual([
      expect.objectContaining({
        projetoId: 'aguardando',
        motivo: 'Aguardando o cliente',
        href: '/entregas/aguardando',
      }),
    ]);
  });

  it('mantém os casos mais urgentes no começo', () => {
    const vencendo = { ...BASE, id: 'vencendo', prazoEm: '2026-08-29T12:00:00.000Z' };
    const bloqueado = { ...BASE, id: 'bloqueado', tarefasBloqueadas: 1 };
    const ajustes = { ...BASE, id: 'ajustes', ajustesSolicitados: 2 };

    expect(
      montarPendenciasEntrega([vencendo, bloqueado, ajustes], AGORA).map(
        ({ projetoId }) => projetoId,
      ),
    ).toEqual(['ajustes', 'bloqueado', 'vencendo']);
  });
});
