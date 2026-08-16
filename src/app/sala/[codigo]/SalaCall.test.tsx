import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ConviteCall } from '@/lib/calls/queries';
import { SalaCall } from './SalaCall';

const CONVITE: ConviteCall = {
  reuniaoId: 'reuniao-1',
  titulo: 'Descoberta do atendimento',
  agendadaPara: '2026-08-12T18:30:00-03:00',
  duracaoMinutos: 45,
  status: 'agendada',
  liveCoachAtivo: true,
  salaProvedor: 'sala-1',
  disponivel: true,
};

describe('SalaCall', () => {
  it('explica o registro e exige consentimento antes de liberar a entrada', async () => {
    const user = userEvent.setup();
    render(
      <SalaCall
        codigo="codigo-1"
        convite={CONVITE}
        anfitriao
        nomeSugerido="Rafael"
        videoConfigurado
      />,
    );

    expect(screen.getByText('Sala disponível')).toBeInTheDocument();
    expect(screen.getByText('Áudio e transcrição privados')).toBeInTheDocument();
    expect(screen.getByText('Resumo para revisão')).toBeInTheDocument();
    expect(screen.getByText('Coach só para você')).toBeInTheDocument();

    const entrar = screen.getByRole('button', { name: 'Entrar na call' });
    expect(entrar).toBeDisabled();

    await user.click(screen.getByRole('checkbox'));
    expect(entrar).toBeEnabled();
  });
});
