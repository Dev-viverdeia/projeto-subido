import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { iniciarEnriquecimento } from '@/lib/crm/invocar-enriquecimento';
import { FormularioEnriquecimento } from './FormularioEnriquecimento';

const atualizar = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: atualizar }),
}));

vi.mock('@/lib/crm/invocar-enriquecimento', () => ({
  iniciarEnriquecimento: vi.fn(),
}));

describe('FormularioEnriquecimento', () => {
  beforeEach(() => {
    atualizar.mockReset();
    vi.mocked(iniciarEnriquecimento).mockReset();
  });

  it('confirma o custo e envia somente a oportunidade', async () => {
    vi.mocked(iniciarEnriquecimento).mockResolvedValue({
      dados: { id: '11111111-1111-4111-8111-111111111111', status: 'na_fila' },
      falha: null,
    });

    render(
      <FormularioEnriquecimento
        oportunidadeId="22222222-2222-4222-8222-222222222222"
        saldoCreditos={20}
        temDossie={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enriquecer dados' }));
    expect(screen.getByTestId('enriquecimento-scrim').parentElement).toBe(document.body);
    expect(document.body).toHaveStyle({ overflow: 'hidden' });
    const dialogo = screen.getByRole('dialog', {
      name: 'Enriquecer os dados deste cliente?',
    });
    expect(within(dialogo).getByText('3 créditos')).toBeInTheDocument();
    expect(within(dialogo).getByText('17')).toBeInTheDocument();

    fireEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar por 3 créditos' }));

    await waitFor(() =>
      expect(iniciarEnriquecimento).toHaveBeenCalledWith({
        oportunidade_id: '22222222-2222-4222-8222-222222222222',
      }),
    );
    expect(atualizar).toHaveBeenCalled();
  });

  it('explica o saldo insuficiente e não inicia a operação', () => {
    render(
      <FormularioEnriquecimento
        oportunidadeId="22222222-2222-4222-8222-222222222222"
        saldoCreditos={2}
        temDossie={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enriquecer dados' }));
    const dialogo = screen.getByRole('dialog', {
      name: 'Enriquecer os dados deste cliente?',
    });
    expect(within(dialogo).getByText(/Seu saldo é de 2 créditos/)).toBeInTheDocument();
    expect(
      within(dialogo).getByRole('button', { name: 'Confirmar por 3 créditos' }),
    ).toBeDisabled();
    expect(iniciarEnriquecimento).not.toHaveBeenCalled();
  });
});
