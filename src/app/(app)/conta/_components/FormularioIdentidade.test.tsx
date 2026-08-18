import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormularioIdentidade } from './FormularioIdentidade';

vi.mock('@/lib/auth/actions', () => ({
  atualizarIdentidade: vi.fn(),
}));

afterEach(cleanup);

describe('FormularioIdentidade', () => {
  it('só habilita a gravação quando o nome realmente muda', async () => {
    const usuario = userEvent.setup();
    render(<FormularioIdentidade nome="QA Subido" />);

    const campo = screen.getByRole('textbox', { name: 'Nome profissional' });
    const salvar = screen.getByRole('button', { name: /Salvar nome/ });
    const descartar = screen.getByRole('button', { name: /Descartar/ });

    expect(campo).toHaveValue('QA Subido');
    expect(salvar).toBeDisabled();
    expect(descartar).toBeDisabled();

    await usuario.clear(campo);
    await usuario.type(campo, 'QA Subido Operações');

    expect(salvar).toBeEnabled();
    expect(descartar).toBeEnabled();
    expect(screen.getByText('Salve para aplicar a alteração.')).toBeInTheDocument();

    await usuario.click(descartar);
    expect(campo).toHaveValue('QA Subido');
    expect(salvar).toBeDisabled();
  });
});
