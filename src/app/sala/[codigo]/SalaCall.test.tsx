import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ConviteCall } from '@/lib/calls/queries';

vi.mock('@livekit/components-react', () => ({
  LiveKitRoom: ({
    children,
    onDisconnected,
  }: {
    children: React.ReactNode;
    onDisconnected?: (reason?: number) => void;
  }) => (
    <div data-testid="sala-livekit">
      {children}
      <button type="button" onClick={() => onDisconnected?.(9)}>
        Simular queda de conexão
      </button>
    </div>
  ),
  RoomAudioRenderer: () => null,
  VideoConference: () => <div>Palco da reunião</div>,
}));

vi.mock('./LiveCoach', () => ({ LiveCoach: () => <aside>Live Coach</aside> }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

import { SalaCall } from './SalaCall';

const CONVITE: ConviteCall = {
  reuniaoId: 'reuniao-1',
  titulo: 'Descoberta do atendimento',
  tipo: 'descoberta',
  agendadaPara: '2099-08-12T18:30:00-03:00',
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
    expect(screen.getByText('Transcrição privada')).toBeInTheDocument();
    expect(screen.getByText('Resumo para revisar')).toBeInTheDocument();
    expect(screen.getByText('Coach privado')).toBeInTheDocument();

    const entrar = screen.getByRole('button', { name: 'Entrar na reunião' });
    expect(entrar).toBeDisabled();

    await user.click(screen.getByRole('checkbox'));
    expect(entrar).toBeEnabled();
  });

  it('preserva a reunião e orienta o usuário quando a conexão cai', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          server_url: 'wss://livekit.example.test',
          participant_token: 'token-de-teste',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    render(
      <SalaCall
        codigo="codigo-1"
        convite={CONVITE}
        anfitriao
        nomeSugerido="Rafael"
        videoConfigurado
      />,
    );

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Entrar na reunião' }));
    await user.click(await screen.findByRole('button', { name: 'Simular queda de conexão' }));

    expect(screen.getByRole('heading', { name: 'Reconectando à reunião' })).toBeInTheDocument();
    expect(screen.getByText('Tentativa 1 de 3')).toBeInTheDocument();
    expect(screen.queryByText('Preparando o resumo da reunião')).not.toBeInTheDocument();

    fetchMock.mockRestore();
  });

  it('prepara o kickoff como acordo do projeto e deixa a revisão explícita', () => {
    render(
      <SalaCall
        codigo="codigo-1"
        convite={{ ...CONVITE, tipo: 'kickoff', titulo: 'Kickoff do projeto' }}
        anfitriao
        nomeSugerido="Rafael"
        videoConfigurado
      />,
    );

    expect(screen.getByText('Sala do kickoff')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preparar kickoff' })).toBeInTheDocument();
    expect(screen.getByText('Resultado e sucesso')).toBeInTheDocument();
    expect(screen.getByText('Responsáveis e acessos')).toBeInTheDocument();
    expect(screen.getByText('Acordo para revisar')).toBeInTheDocument();
    expect(screen.getByText('Revise o acordo antes de iniciar a execução.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar no kickoff' })).toBeDisabled();
  });
});
