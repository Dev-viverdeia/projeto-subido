import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { conferirEnriquecimento, iniciarEnriquecimento } from '@/lib/crm/invocar-enriquecimento';
import { FormularioEnriquecimento } from './FormularioEnriquecimento';

const atualizar = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: atualizar }),
}));

vi.mock('@/lib/crm/invocar-enriquecimento', () => ({
  iniciarEnriquecimento: vi.fn(),
  conferirEnriquecimento: vi.fn(),
}));

describe('FormularioEnriquecimento', () => {
  beforeEach(() => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    atualizar.mockReset();
    vi.mocked(iniciarEnriquecimento).mockReset();
    vi.mocked(conferirEnriquecimento).mockReset().mockResolvedValue(null);
  });

  it('não envia uma solicitação paga sem conexão', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render(
      <FormularioEnriquecimento
        oportunidadeId="22222222-2222-4222-8222-222222222222"
        saldoCreditos={20}
        temDossie={false}
        abertoInicial
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Usar 3 créditos' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sem conexão');
    expect(iniciarEnriquecimento).not.toHaveBeenCalled();
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
    const dialogo = screen.getByRole('dialog', {
      name: 'Enriquecer esta oportunidade?',
    });
    expect(dialogo.parentElement?.parentElement?.parentElement).toBe(document.body);
    expect(document.body).toHaveStyle({ overflow: 'hidden' });
    expect(within(dialogo).getByText('3 créditos')).toBeInTheDocument();
    expect(within(dialogo).getByText('17')).toBeInTheDocument();

    fireEvent.click(within(dialogo).getByRole('button', { name: 'Usar 3 créditos' }));

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
      name: 'Enriquecer esta oportunidade?',
    });
    expect(within(dialogo).getByText(/Seu saldo é de 2 créditos/)).toBeInTheDocument();
    expect(within(dialogo).getByRole('button', { name: 'Usar 3 créditos' })).toBeDisabled();
    expect(iniciarEnriquecimento).not.toHaveBeenCalled();
  });

  it('recupera uma falha de rede sem prometer que nenhum crédito foi usado', async () => {
    vi.mocked(iniciarEnriquecimento).mockRejectedValue(new Error('offline'));
    render(
      <FormularioEnriquecimento
        oportunidadeId="22222222-2222-4222-8222-222222222222"
        saldoCreditos={20}
        temDossie={false}
        abertoInicial
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Usar 3 créditos' }));
    await screen.findByText('Confirmação pendente');
    expect(screen.queryByRole('button', { name: 'Usar 3 créditos' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Conferir andamento' }));
    expect(await screen.findByText(/Ainda não encontramos/)).toBeVisible();
    expect(iniciarEnriquecimento).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Nenhum crédito foi usado/)).not.toBeInTheDocument();
    expect(atualizar).toHaveBeenCalled();
  });

  it('cede o modal ao andamento confirmado pela ficha, sem sobrepor a confirmação', async () => {
    vi.mocked(iniciarEnriquecimento).mockResolvedValue({
      dados: null,
      falha: 'Confira o andamento na ficha.',
      incerto: true,
    });
    const props = {
      oportunidadeId: '22222222-2222-4222-8222-222222222222',
      saldoCreditos: 20,
      temDossie: false,
      abertoInicial: true,
    };
    const { rerender } = render(<FormularioEnriquecimento {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Usar 3 créditos' }));
    await screen.findByText('Confirmação pendente');
    rerender(<FormularioEnriquecimento {...props} desabilitado />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
