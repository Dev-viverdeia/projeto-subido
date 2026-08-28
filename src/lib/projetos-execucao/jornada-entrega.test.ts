import { describe, expect, it } from 'vitest';
import { obterEstadoJornadaEntrega } from './jornada-entrega';

const tarefa = {
  id: 'tarefa-1',
  titulo: 'Validar o atendimento',
  status: 'concluida' as const,
  clienteStatus: 'nao_solicitada' as const,
};

describe('obterEstadoJornadaEntrega', () => {
  it('prioriza o ajuste pedido pelo cliente e devolve a entrega para execução', () => {
    const estado = obterEstadoJornadaEntrega({
      status: 'em_validacao',
      briefingConfirmado: true,
      tarefas: [{ ...tarefa, status: 'em_andamento', clienteStatus: 'ajustes' }],
      compromisso: null,
    });

    expect(estado).toMatchObject({
      momento: 'executar',
      tom: 'ajuste',
      destino: 'tarefa',
      tarefaId: 'tarefa-1',
    });
  });

  it('mantém o profissional informado enquanto o cliente decide', () => {
    const estado = obterEstadoJornadaEntrega({
      status: 'em_validacao',
      briefingConfirmado: true,
      tarefas: [{ ...tarefa, clienteStatus: 'aguardando' }],
      compromisso: null,
    });

    expect(estado).toMatchObject({
      momento: 'validar',
      tom: 'aguardando',
      destino: 'validacao',
    });
  });

  it('só encerra a jornada depois do aceite final', () => {
    const antes = obterEstadoJornadaEntrega({
      status: 'em_validacao',
      briefingConfirmado: true,
      tarefas: [tarefa],
      compromisso: null,
    });
    const depois = obterEstadoJornadaEntrega({
      status: 'concluido',
      briefingConfirmado: true,
      tarefas: [{ ...tarefa, clienteStatus: 'aprovada' }],
      compromisso: null,
    });

    expect(antes.rotuloAcao).toBe('Formalizar a entrega final');
    expect(depois).toMatchObject({ momento: 'entregar', tom: 'concluido', destino: 'validacao' });
  });
});
