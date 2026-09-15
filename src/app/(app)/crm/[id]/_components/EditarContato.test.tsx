import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/lib/crm/contato-actions', () => ({ salvarContatoFicha: vi.fn() }));
import { EditarContato } from './EditarContato';

it('valida o e-mail digitado sem enviar a versão anterior', async () => {
  const salvar = vi.fn();
  const user = userEvent.setup();
  render(
    <EditarContato
      inicial={{
        oportunidade: '11111111-1111-4111-8111-111111111111',
        contatoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        revisao: 0,
        nome: 'Ana',
        email: 'ana@example.test',
        telefone: '',
      }}
      salvar={salvar}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'Editar contato' }));
  await user.clear(screen.getByLabelText('E-mail'));
  await user.type(screen.getByLabelText('E-mail'), 'invalido');
  await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  expect(salvar).not.toHaveBeenCalled();
  expect(screen.getByText('Digite um e-mail válido.')).toBeVisible();
});
