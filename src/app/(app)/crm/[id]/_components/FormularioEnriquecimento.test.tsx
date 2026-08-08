import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
  it('exige uma fonte, envia o site e atualiza o dossiê', async () => {
    vi.mocked(iniciarEnriquecimento).mockResolvedValue({
      dados: { id: '11111111-1111-4111-8111-111111111111', status: 'na_fila' },
      falha: null,
    });

    render(
      <FormularioEnriquecimento
        oportunidadeId="22222222-2222-4222-8222-222222222222"
        dominioInicial={null}
        linkedinInicial={null}
        temDossie={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enriquecer lead' }));
    const enviar = screen.getByRole('button', { name: 'Analisar fontes' });
    fireEvent.click(enviar);
    expect(
      screen.getByText('Informe o site da empresa ou escreva o contexto que você já conhece.'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Site da empresa'), {
      target: { value: 'empresa.com.br' },
    });
    fireEvent.click(enviar);

    await waitFor(() =>
      expect(iniciarEnriquecimento).toHaveBeenCalledWith({
        oportunidade_id: '22222222-2222-4222-8222-222222222222',
        dominio: 'empresa.com.br',
        linkedin_url: undefined,
        contexto: undefined,
      }),
    );
    expect(atualizar).toHaveBeenCalled();
  });
});
