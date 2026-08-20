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
  contatoEmail: 'camila@clinicaaurora.com.br',
};
const CALENDAR_CONECTADO = {
  configurado: true,
  conectado: true,
  email: 'profissional@gmail.com',
  status: 'ativa' as const,
  ultimoErro: null,
};

describe('FormularioAgendarCall', () => {
  it('abre com oportunidade real, Live Coach ativo e devolve o foco ao fechar', async () => {
    agendarReuniaoMock.mockResolvedValue({});
    render(<FormularioAgendarCall oportunidades={[OPORTUNIDADE]} calendar={CALENDAR_CONECTADO} />);

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

  it('abre pelo dossiê com a oportunidade e o fuso local corretos', async () => {
    agendarReuniaoMock.mockResolvedValue({});
    render(
      <FormularioAgendarCall
        oportunidades={[OPORTUNIDADE]}
        calendar={CALENDAR_CONECTADO}
        abertoInicial
        oportunidadeInicial={OPORTUNIDADE.id}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Agendar call' })).toBeInTheDocument();
    expect(screen.getByText('Oportunidade vinculada')).toBeInTheDocument();
    expect(screen.getByText('Clínica Aurora')).toBeInTheDocument();
    expect(document.querySelector<HTMLInputElement>('input[name="oportunidade"]')).toHaveValue(
      OPORTUNIDADE.id,
    );
    await waitFor(() => expect(screen.getByLabelText('Tipo de call')).toHaveFocus());
    await waitFor(() =>
      expect(document.querySelector<HTMLInputElement>('input[name="offsetMinutos"]')).toHaveValue(
        String(new Date().getTimezoneOffset()),
      ),
    );
  });

  it('preserva o fuso local quando a oportunidade selecionada atualiza o formulário', async () => {
    const user = userEvent.setup();
    agendarReuniaoMock.mockResolvedValue({});
    render(
      <FormularioAgendarCall
        oportunidades={[OPORTUNIDADE]}
        calendar={CALENDAR_CONECTADO}
        abertoInicial
      />,
    );

    await waitFor(() =>
      expect(document.querySelector<HTMLInputElement>('input[name="offsetMinutos"]')).toHaveValue(
        String(new Date().getTimezoneOffset()),
      ),
    );
    await user.selectOptions(screen.getByLabelText('Oportunidade'), OPORTUNIDADE.id);

    expect(document.querySelector<HTMLInputElement>('input[name="offsetMinutos"]')).toHaveValue(
      String(new Date().getTimezoneOffset()),
    );
  });

  it('abre o kickoff do projeto com oportunidade e tipo já definidos', () => {
    agendarReuniaoMock.mockResolvedValue({});
    render(
      <FormularioAgendarCall
        oportunidades={[OPORTUNIDADE]}
        calendar={CALENDAR_CONECTADO}
        abertoInicial
        oportunidadeInicial={OPORTUNIDADE.id}
        tipoInicial="kickoff"
      />,
    );

    expect(document.querySelector<HTMLInputElement>('input[name="oportunidade"]')).toHaveValue(
      OPORTUNIDADE.id,
    );
    expect(screen.getByLabelText('Tipo de call')).toHaveValue('kickoff');
  });

  it('prepara o convite no Google com o e-mail que já está no CRM', () => {
    agendarReuniaoMock.mockResolvedValue({});
    render(
      <FormularioAgendarCall
        oportunidades={[OPORTUNIDADE]}
        abertoInicial
        oportunidadeInicial={OPORTUNIDADE.id}
        calendar={CALENDAR_CONECTADO}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Convite pelo Google Calendar' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail do cliente')).toHaveValue('camila@clinicaaurora.com.br');
    expect(screen.getByRole('button', { name: 'Criar call e enviar convite' })).toBeInTheDocument();
    expect(
      document.querySelector<HTMLInputElement>('input[name="enviarConviteGoogle"]'),
    ).toHaveValue('on');
  });

  it('abre o setup do Calendar antes do primeiro agendamento e retorna para a call', () => {
    agendarReuniaoMock.mockResolvedValue({});
    render(
      <FormularioAgendarCall
        oportunidades={[OPORTUNIDADE]}
        abertoInicial
        oportunidadeInicial={OPORTUNIDADE.id}
        calendar={{
          configurado: true,
          conectado: false,
          email: null,
          status: 'desconectada',
          ultimoErro: null,
        }}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Conecte sua agenda' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Data e horário')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Criar call/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Conectar Google Calendar/ })).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent(`/calls?nova=1&oportunidade=${OPORTUNIDADE.id}`)),
    );
  });

  it('bloqueia o formulário enquanto a integração do Calendar não estiver ativa', () => {
    agendarReuniaoMock.mockResolvedValue({});
    render(
      <FormularioAgendarCall
        oportunidades={[OPORTUNIDADE]}
        abertoInicial
        calendar={{
          configurado: false,
          conectado: false,
          email: null,
          status: 'desconectada',
          ultimoErro: null,
        }}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Conecte sua agenda' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Data e horário')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Conexão indisponível' })).toBeDisabled();
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
    render(<FormularioAgendarCall oportunidades={[OPORTUNIDADE]} calendar={CALENDAR_CONECTADO} />);

    await user.click(screen.getByRole('button', { name: 'Agendar call' }));
    await user.click(screen.getByRole('button', { name: 'Criar call e enviar convite' }));

    const oportunidade = await screen.findByLabelText(/Oportunidade/);
    await waitFor(() => expect(oportunidade).toHaveFocus());
    expect(oportunidade).toHaveAttribute('aria-describedby', 'calls-oportunidade-msg');

    await user.selectOptions(oportunidade, OPORTUNIDADE.id);
    expect(screen.queryByText('Escolha uma oportunidade do CRM.')).not.toBeInTheDocument();
    expect(screen.getByText('Escolha data e horário.')).toBeInTheDocument();
  });
});
