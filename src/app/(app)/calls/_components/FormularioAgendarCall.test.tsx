import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { OportunidadeSeletor } from '@/lib/crm/queries';

const { agendarReuniaoMock } = vi.hoisted(() => ({
  agendarReuniaoMock: vi.fn(),
}));

vi.mock('@/lib/calls/actions', () => ({
  agendarReuniao: agendarReuniaoMock,
}));

import { FormularioAgendarCall } from './FormularioAgendarCall';

const OPORTUNIDADE: OportunidadeSeletor = {
  id: '22222222-2222-4222-8222-222222222222',
  titulo: 'Automação do atendimento',
  etapa: 'descoberta',
  empresa: 'Clínica Aurora',
  dominio: 'clinicaaurora.com.br',
  contato: 'Camila Rios',
};

describe('FormularioAgendarCall', () => {
  it('abre com oportunidade real, Live Coach ativo e devolve o foco ao fechar', async () => {
    agendarReuniaoMock.mockResolvedValue({});
    render(<FormularioAgendarCall oportunidades={[OPORTUNIDADE]} />);

    const gatilho = screen.getByRole('button', { name: 'Agendar call' });
    fireEvent.click(gatilho);

    expect(screen.getByRole('dialog', { name: 'Agendar call' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Oportunidade')).toHaveFocus());
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByRole('option', { name: /Clínica Aurora/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(gatilho).toHaveFocus());
  });

  it('anuncia os erros, foca a primeira decisão e limpa o campo corrigido', async () => {
    const user = userEvent.setup();
    agendarReuniaoMock.mockResolvedValue({
      campos: {
        oportunidade: '',
        tipo: 'descoberta',
        titulo: '',
        agendadaPara: '',
        duracao: '45',
      },
      porCampo: {
        oportunidade: 'Escolha uma oportunidade do CRM.',
        agendadaPara: 'Escolha data e horário.',
      },
    });
    render(<FormularioAgendarCall oportunidades={[OPORTUNIDADE]} />);

    await user.click(screen.getByRole('button', { name: 'Agendar call' }));
    await user.click(screen.getByRole('button', { name: 'Criar call e link' }));

    const oportunidade = await screen.findByLabelText(/Oportunidade/);
    await waitFor(() => expect(oportunidade).toHaveFocus());
    expect(oportunidade).toHaveAttribute('aria-describedby', 'calls-oportunidade-msg');

    await user.selectOptions(oportunidade, OPORTUNIDADE.id);
    expect(screen.queryByText('Escolha uma oportunidade do CRM.')).not.toBeInTheDocument();
    expect(screen.getByText('Escolha data e horário.')).toBeInTheDocument();
  });
});
