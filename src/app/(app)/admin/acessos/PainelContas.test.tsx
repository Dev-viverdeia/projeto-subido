import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PainelContas } from './PainelContas';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/lib/admin/actions', () => ({
  ESTADO_ADMIN_ACESSO: { status: 'inicial' },
  alterarPlanoAdmin: vi.fn(),
  concederPacoteAdmin: vi.fn(),
}));

afterEach(cleanup);

describe('PainelContas', () => {
  it('abre a conta inteira e pede confirmação antes de trocar o plano', async () => {
    const usuario = userEvent.setup();
    render(
      <PainelContas
        busca=""
        eventos={[]}
        contas={[
          {
            id: '22222222-2222-4222-8222-222222222222',
            nome: 'Rafael QA',
            email: 'qa@viverdeia.ai',
            plano: 'pro',
            saldo: 30,
            ultimoAcessoEm: null,
            criadaEm: '2026-08-23T12:00:00.000Z',
          },
        ]}
      />,
    );

    await usuario.click(screen.getByRole('button', { name: /Rafael QA/ }));

    expect(screen.getByRole('dialog', { name: 'Rafael QA' })).toBeInTheDocument();
    expect(screen.getByText('Adicionar um pacote de créditos')).toBeInTheDocument();
    expect(screen.getByText('23 de ago. de 2026')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /Starter/ }));

    expect(screen.getByText(/Mudar Rafael QA para o plano Starter/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar mudança' })).toBeInTheDocument();
  });
});
