import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditarEmpresa } from './EditarEmpresa';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/lib/crm/empresa-actions', () => ({ salvarEmpresaFicha: vi.fn() }));
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
  empresaId: '22222222-2222-4222-8222-222222222222',
  revisao: 0,
  nome: 'Empresa QA',
  site: 'empresa.com.br',
};

afterEach(cleanup);

describe('Foco após editar empresa', () => {
  it('devolve o foco ao botão atual quando a atualização deixa o body ativo', async () => {
    const usuario = userEvent.setup();
    render(<EditarEmpresa inicial={inicial} salvar={async () => ({ ok: true })} />);
    const abrir = screen.getByRole('button', { name: 'Editar empresa' });
    await usuario.click(abrir);
    await usuario.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await screen.findByText('Empresa salva');
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
        <EditarEmpresa inicial={inicial} salvar={salvar} />
        <button>Outra ação</button>
      </>,
    );
    await usuario.click(screen.getByRole('button', { name: 'Editar empresa' }));
    await usuario.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    const outraAcao = screen.getByRole('button', { name: 'Outra ação' });
    await usuario.click(outraAcao);
    await act(async () => {
      concluir({ ok: true });
    });
    await screen.findByText('Empresa salva');
    await act(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    });
    expect(outraAcao).toHaveFocus();
  });
});
