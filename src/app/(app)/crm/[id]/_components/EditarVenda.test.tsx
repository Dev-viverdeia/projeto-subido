import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditarVenda } from './EditarVenda';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/lib/crm/venda-actions', () => ({ salvarVendaFicha: vi.fn() }));
// Simula a atualização do servidor removendo o modal sem um gatilho antigo válido.
vi.mock('../../../_components/ModalOperacao', () => ({
  ModalOperacao: ({
    open,
    children,
    footer,
  }: {
    open: boolean;
    children: ReactNode;
    footer: ReactNode;
  }) =>
    open ? (
      <div role="dialog">
        {children}
        {footer}
      </div>
    ) : null,
}));

const inicial = {
  oportunidade: '11111111-1111-4111-8111-111111111111',
  revisao: 0,
  titulo: 'Projeto QA',
  valor: '12.500,00',
};

afterEach(cleanup);

describe('Foco após editar venda', () => {
  it('devolve o foco ao botão atual quando a atualização deixa o body ativo', async () => {
    const usuario = userEvent.setup();
    render(<EditarVenda inicial={inicial} salvar={() => Promise.resolve({ ok: true })} />);
    const abrir = screen.getByRole('button', { name: 'Editar venda' });
    await usuario.click(abrir);
    await usuario.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await screen.findByText('Venda salva');
    await waitFor(() => expect(abrir).toHaveFocus());
  });

  it('não rouba o foco se outra ação já o recebeu', async () => {
    const usuario = userEvent.setup();
    let concluir!: (valor: { ok: true }) => void;
    const salvar = () =>
      new Promise<{ ok: true }>((resolve) => {
        concluir = resolve;
      });
    render(
      <>
        <EditarVenda inicial={inicial} salvar={salvar} />
        <button>Outra ação</button>
      </>,
    );
    await usuario.click(screen.getByRole('button', { name: 'Editar venda' }));
    await usuario.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    const outraAcao = screen.getByRole('button', { name: 'Outra ação' });
    await usuario.click(outraAcao);
    await act(async () => {
      concluir({ ok: true });
      await Promise.resolve();
    });
    await screen.findByText('Venda salva');
    await act(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    });
    expect(outraAcao).toHaveFocus();
  });
});
