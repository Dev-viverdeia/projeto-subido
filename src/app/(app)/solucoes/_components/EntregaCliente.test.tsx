import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { EventoProjetoExecucao, TarefaProjetoExecucao } from '@/lib/projetos-execucao/queries';

vi.mock('@/lib/projetos-execucao/entrega-actions', () => ({
  prepararEntregaCliente: vi.fn(),
  reenviarNotificacaoEntregaCliente: vi.fn(),
}));

import { EntregaCliente } from './EntregaCliente';

const TAREFA: TarefaProjetoExecucao = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  faseId: 'entregar',
  faseTitulo: 'Entregar',
  passoId: 'validar',
  titulo: 'Validar atendimento',
  acao: 'Compartilhe o fluxo final.',
  concluidoQuando: 'O cliente aprovou o fluxo.',
  entregavel: 'Fluxo publicado.',
  ordem: 1,
  status: 'concluida',
  evidencia: 'Fluxo testado.',
  evidenciaEm: '2026-09-01T11:00:00.000Z',
  concluidaEm: '2026-09-01T11:00:00.000Z',
  clienteStatus: 'aguardando',
  clienteNota: null,
  entregavelUrl: 'https://example.com/entrega',
  clienteSolicitadoEm: '2026-09-01T12:00:00.000Z',
  clienteRespondidoEm: null,
  clienteComentario: null,
};

const CONVITE: EventoProjetoExecucao = {
  id: '77777777-7777-4777-8777-777777777777',
  tarefaId: TAREFA.id,
  tipo: 'aprovacao_solicitada',
  autor: 'prestador',
  comentario: null,
  criadoEm: '2026-09-01T12:00:00.000Z',
  emailDestinatario: 'cliente@empresa.com.br',
  emailStatus: 'entregue',
};

describe('EntregaCliente', () => {
  it('mostra o lembrete automático no mesmo bloco da notificação', () => {
    render(
      <EntregaCliente
        projetoId="11111111-1111-4111-8111-111111111111"
        tarefa={TAREFA}
        portalAtivo
        clienteEmail="cliente@empresa.com.br"
        notificacao={CONVITE}
        lembrete={{
          ...CONVITE,
          id: '88888888-8888-4888-8888-888888888888',
          tipo: 'lembrete_aprovacao',
          criadoEm: '2026-09-03T12:00:00.000Z',
          emailOrigemEventoId: CONVITE.id,
        }}
      />,
    );

    expect(screen.getByText('Agora é com o cliente.')).toBeVisible();
    expect(screen.getByText('Lembrete entregue ao cliente.')).toBeVisible();
  });

  it('explica o próximo lembrete sem prometer vários avisos', () => {
    render(
      <EntregaCliente
        projetoId="11111111-1111-4111-8111-111111111111"
        tarefa={TAREFA}
        portalAtivo
        clienteEmail="cliente@empresa.com.br"
        notificacao={CONVITE}
        lembrete={null}
      />,
    );

    expect(screen.getByText(/enviaremos um único lembrete após 48 horas/i)).toBeVisible();
  });
});
