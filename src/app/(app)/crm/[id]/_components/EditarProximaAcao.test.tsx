import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EditarProximaAcao } from './EditarProximaAcao';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/lib/crm/actions', () => ({
  definirProximaAcao: vi.fn(() => Promise.resolve({})),
}));

describe('EditarProximaAcao', () => {
  it('abre no portal com a ação e o prazo atuais', async () => {
    const user = userEvent.setup();
    render(
      <EditarProximaAcao
        oportunidadeId="22222222-2222-4222-8222-222222222222"
        acaoAtual="Enviar o escopo revisado."
        quandoAtual="2099-08-25T12:00:00-03:00"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Editar próxima ação' }));

    const dialogo = screen.getByRole('dialog', { name: 'Editar próxima ação' });
    expect(dialogo.parentElement?.parentElement?.parentElement).toBe(document.body);
    expect(within(dialogo).getByRole('textbox')).toHaveValue('Enviar o escopo revisado.');
    expect(within(dialogo).getByLabelText(/Quando você pretende fazer isso/)).toHaveValue(
      '2099-08-25',
    );

    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
