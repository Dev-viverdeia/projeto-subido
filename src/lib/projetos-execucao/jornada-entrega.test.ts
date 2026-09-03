import { describe, expect, it } from 'vitest';
import { obterEstadoJornadaEntrega } from './jornada-entrega';

const tarefa = {
  id: 'tarefa-1',
  titulo: 'Validar o atendimento',
  status: 'concluida' as const,
  clienteStatus: 'nao_solicitada' as const,
};

const dependencia = {
  id: 'acao-1',
  titulo: 'Liberar acesso ao WhatsApp',
  prazoEm: '2026-08-27T12:00:00-03:00',
  status: 'pendente' as const,
  origem: 'briefing',
  categoria: 'acesso' as const,
  reuniaoId: null,
  responsavelTipo: 'cliente' as const,
  responsavelNome: 'Camila',
  visivelCliente: true,
  concluidaEm: null,
  atualizadoEm: '2026-08-20T12:00:00.000Z',
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
      rotuloAcao: 'Trabalhar ajuste',
    });
  });

  it('transforma uma aprovação em passagem clara para a próxima tarefa', () => {
    const estado = obterEstadoJornadaEntrega({
      status: 'em_execucao',
      briefingConfirmado: true,
      tarefas: [
        { ...tarefa, clienteStatus: 'aprovada' },
        {
          ...tarefa,
          id: 'tarefa-2',
          titulo: 'Configurar o atendimento',
          status: 'pendente',
        },
      ],
      compromisso: null,
    });

    expect(estado).toMatchObject({
      momento: 'executar',
      tom: 'aprovado',
      titulo: '“Validar o atendimento” foi aprovada.',
      rotuloAcao: 'Ver próxima tarefa',
      destino: 'tarefa',
      tarefaId: 'tarefa-2',
    });
  });

  it('encerra a passagem da aprovação quando a próxima tarefa já começou', () => {
    const estado = obterEstadoJornadaEntrega({
      status: 'em_execucao',
      briefingConfirmado: true,
      tarefas: [
        { ...tarefa, clienteStatus: 'aprovada' },
        {
          ...tarefa,
          id: 'tarefa-2',
          titulo: 'Configurar o atendimento',
          status: 'em_andamento',
        },
      ],
      compromisso: null,
    });

    expect(estado).toMatchObject({
      tom: 'normal',
      titulo: 'Configurar o atendimento',
      tarefaId: 'tarefa-2',
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

  it('coloca uma dependência atrasada do profissional antes da próxima tarefa', () => {
    const estado = obterEstadoJornadaEntrega({
      status: 'em_execucao',
      briefingConfirmado: true,
      tarefas: [{ ...tarefa, status: 'em_andamento' }],
      compromisso: null,
      dependencias: [{ ...dependencia, responsavelTipo: 'prestador', visivelCliente: false }],
      agora: new Date('2026-08-30T12:00:00.000Z'),
    });

    expect(estado).toMatchObject({
      tom: 'atrasado',
      destino: 'preparacao',
      rotuloAcao: 'Abrir preparação',
    });
    expect(estado.descricao).toContain('Atrasada há 3 dias');
  });

  it('explica quando o próximo movimento depende do cliente', () => {
    const estado = obterEstadoJornadaEntrega({
      status: 'em_execucao',
      briefingConfirmado: true,
      tarefas: [{ ...tarefa, status: 'em_andamento' }],
      compromisso: null,
      dependencias: [{ ...dependencia, prazoEm: '2026-09-02T12:00:00-03:00' }],
      agora: new Date('2026-08-30T12:00:00.000Z'),
    });

    expect(estado).toMatchObject({
      tom: 'aguardando',
      destino: 'preparacao',
      rotuloAcao: 'Ver preparação',
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
