import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  it('abre e fecha o formulário preservando a semântica de diálogo', () => {
    criarLeadMock.mockResolvedValue({});
    render(<FormularioNovoLead />);

    fireEvent.click(screen.getByRole('button', { name: 'Novo lead' }));
    expect(screen.getByRole('dialog', { name: 'Adicionar lead' })).toBeInTheDocument();
    expect(screen.getByLabelText('Empresa')).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
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

    await user.click(screen.getByRole('button', { name: 'Novo lead' }));
    await user.click(screen.getByRole('button', { name: 'Cadastrar e continuar' }));

    await waitFor(() => expect(screen.getByLabelText('Empresa')).toHaveFocus());
    expect(screen.getByText('Digite o nome da empresa.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Empresa'), 'Clínica Aurora');
    expect(screen.queryByText('Digite o nome da empresa.')).not.toBeInTheDocument();
    expect(screen.getByText('Digite o nome do contato.')).toBeInTheDocument();
  });

  it('abre pelo projeto com a oportunidade já identificada', () => {
    criarLeadMock.mockResolvedValue({});
    render(<FormularioNovoLead abertoInicial tituloInicial="Atendimento com IA no WhatsApp" />);

    expect(screen.getByRole('dialog', { name: 'Adicionar lead' })).toBeInTheDocument();
    expect(screen.getByLabelText('Oportunidade')).toHaveValue('Atendimento com IA no WhatsApp');
  });
});
