import { describe, expect, it } from 'vitest';
import type { EventoProjetoExecucao } from './queries';
import { obterContatoNotificacao } from './notificacao-cliente';

const base = {
  autor: 'prestador' as const,
  comentario: null,
  criadoEm: '2026-09-01T12:00:00.000Z',
  mudancaEscopoId: null,
};

describe('contato da validação do cliente', () => {
  it('liga o lembrete à solicitação mais recente da tarefa', () => {
    const eventos: EventoProjetoExecucao[] = [
      {
        ...base,
        id: 'lembrete',
        tarefaId: 'tarefa',
        tipo: 'lembrete_aprovacao',
        emailOrigemEventoId: 'convite',
        emailDestinatario: 'cliente@empresa.com.br',
      },
      {
        ...base,
        id: 'convite',
        tarefaId: 'tarefa',
        tipo: 'aprovacao_solicitada',
        emailDestinatario: 'cliente@empresa.com.br',
      },
    ];

    expect(obterContatoNotificacao(eventos, 'tarefa', null)).toMatchObject({
      evento: { id: 'convite' },
      lembrete: { id: 'lembrete' },
      email: 'cliente@empresa.com.br',
    });
  });
});
