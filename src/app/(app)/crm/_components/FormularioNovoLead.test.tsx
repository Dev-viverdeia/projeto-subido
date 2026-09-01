import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const { criarLeadMock } = vi.hoisted(() => ({
  criarLeadMock: vi.fn(),
}));

vi.mock('@/lib/crm/actions', () => ({
  criarLead: criarLeadMock,
}));

import { FormularioNovoLead } from './FormularioNovoLead';

describe('FormularioNovoLead', () => {
  it('abre e fecha o formulário preservando a semântica de diálogo', async () => {
    const user = userEvent.setup();
    criarLeadMock.mockResolvedValue({});
    render(<FormularioNovoLead />);

    await user.click(screen.getByRole('button', { name: 'Adicionar empresa' }));
    expect(screen.getByRole('dialog', { name: 'Adicionar oportunidade' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Empresa')).toHaveFocus());

    await user.click(screen.getByRole('button', { name: 'Fechar diálogo' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('leva o foco ao primeiro erro e limpa a mensagem enquanto o campo é corrigido', async () => {
    const user = userEvent.setup();
    criarLeadMock.mockResolvedValue({
      campos: { empresa: '', contato: '', email: '', titulo: '' },
      porCampo: {
        empresa: 'Digite o nome da empresa.',
        contato: 'Digite o nome do contato.',
      },
    });
    render(<FormularioNovoLead />);

    await user.click(screen.getByRole('button', { name: 'Adicionar empresa' }));
    await user.click(screen.getByRole('button', { name: 'Criar oportunidade' }));

    await waitFor(() => expect(screen.getByLabelText('Empresa')).toHaveFocus());
    expect(screen.getByText('Digite o nome da empresa.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Empresa'), 'Clínica Aurora');
    expect(screen.queryByText('Digite o nome da empresa.')).not.toBeInTheDocument();
    expect(screen.getByText('Digite o nome do contato.')).toBeInTheDocument();
  });

  it('abre pelo projeto com a venda já identificada', () => {
    criarLeadMock.mockResolvedValue({});
    render(
      <FormularioNovoLead
        abertoInicial
        tituloInicial="Atendimento com IA no WhatsApp"
        projetoSlug="sdr-atendimento-qualificacao"
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Adicionar oportunidade' })).toBeInTheDocument();
    expect(screen.getByLabelText('Projeto de IA (opcional)')).toHaveValue(
      'Atendimento com IA no WhatsApp',
    );
    expect(document.querySelector('input[name="projeto"]')).toHaveValue(
      'sdr-atendimento-qualificacao',
    );
  });
});
