import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import './SalaEntrega.test-mocks';
import { PROJETO } from './SalaEntrega.test-fixtures';
import { SalaEntrega } from './SalaEntrega';
import { contarPendenciasCliente } from './PendenciasClienteEntrega';

describe('ficha clara de entrega', () => {
  it('deixa o tipo e a conclusão no cabeçalho sem mudar as confirmações', async () => {
    const user = userEvent.setup();
    render(<SalaEntrega projeto={PROJETO} />);
    const gestao = screen.getByRole('region', { name: 'Gestão da entrega' });
    expect(gestao.closest('header')).not.toBeNull();
    await user.click(within(gestao).getByRole('button', { name: 'Concluir entrega' }));
    expect(within(screen.getByRole('dialog')).getByRole('checkbox')).toBeRequired();
  });

  it('abre a validação pendente no lugar certo e transfere o foco', async () => {
    const user = userEvent.setup();
    const projeto = {
      ...PROJETO,
      tarefas: PROJETO.tarefas.map((t, i) =>
        i === 0 ? { ...t, status: 'concluida' as const, clienteStatus: 'aguardando' as const } : t,
      ),
    };
    render(<SalaEntrega projeto={projeto} />);
    await user.click(screen.getByRole('button', { name: /Cliente.*1 pendência com o cliente/ }));
    expect(screen.getByRole('region', { name: 'Com o cliente' })).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: `Ver validação: ${projeto.tarefas[0]?.titulo}` }),
    );
    await waitFor(() => expect(document.getElementById('validacao-cliente')).toHaveFocus());
    expect(screen.getByText('Agora é com o cliente.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Trabalho' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('não conta ajustes do profissional como uma espera pelo cliente', () => {
    expect(
      contarPendenciasCliente({
        ...PROJETO,
        acoesPlano: [],
        tarefas: PROJETO.tarefas.map((t) => ({
          ...t,
          clienteStatus: 'ajustes',
        })),
      }),
    ).toBe(0);
  });

  it('inclui acessos e compromissos do cliente, mas não itens cancelados ou do profissional', () => {
    const acao = {
      id: 'acao-1',
      titulo: 'Liberar acesso',
      prazoEm: null,
      status: 'pendente' as const,
      origem: 'briefing',
      categoria: 'acesso' as const,
      reuniaoId: null,
      responsavelTipo: 'cliente' as const,
      responsavelNome: 'Camila',
      visivelCliente: true,
      concluidaEm: null,
      atualizadoEm: '2026-09-11T12:00:00Z',
    };
    expect(
      contarPendenciasCliente({
        ...PROJETO,
        tarefas: [],
        mudancasEscopo: [],
        acoesPlano: [
          acao,
          { ...acao, id: 'acao-2', categoria: 'compromisso' },
          { ...acao, id: 'acao-3', status: 'cancelada' },
          { ...acao, id: 'acao-4', responsavelTipo: 'prestador' },
        ],
      }),
    ).toBe(2);
  });

  it('não transforma conclusão manual em aprovação ao consultar o trabalho', async () => {
    const user = userEvent.setup();
    render(<SalaEntrega projeto={{ ...PROJETO, status: 'concluido', encerramento: null }} />);
    expect(screen.getByText('Conclusão por você · sem aceite final')).toBeVisible();
    expect(screen.queryByText('Aceite registrado pelo cliente')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Trabalho' }));
    expect(screen.getByText('Entrega concluída por você.')).toBeVisible();
    expect(screen.queryByText('Entrega aprovada e encerrada.')).toBeNull();
  });

  it('revela compromissos além dos cinco primeiros ao abrir uma pendência', async () => {
    const user = userEvent.setup();
    const projeto = {
      ...PROJETO,
      acoesPlano: Array.from({ length: 6 }, (_, i) => ({
        id: `compromisso-${i}`,
        titulo: `Confirmar item ${i + 1}`,
        prazoEm: null,
        status: 'pendente' as const,
        origem: 'briefing',
        categoria: 'compromisso' as const,
        reuniaoId: null,
        responsavelTipo: 'cliente' as const,
        responsavelNome: 'Camila',
        visivelCliente: true,
        concluidaEm: null,
        atualizadoEm: '2026-09-11T12:00:00Z',
      })),
    };
    render(<SalaEntrega projeto={projeto} />);
    await user.click(screen.getByRole('button', { name: /Cliente.*6 pendências/ }));
    await user.click(screen.getByRole('button', { name: 'Ver compromisso: Confirmar item 6' }));
    await waitFor(() => expect(document.getElementById('plano-vivo-titulo')).toHaveFocus());
    const plano = screen.getByRole('region', { name: 'Compromissos com o cliente' });
    expect(within(plano).getByText('Confirmar item 6')).toBeVisible();
    expect(plano.querySelector('details')).toHaveAttribute('open');
  });
});
