import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MIDIA_INICIAL } from './usePreparacaoMidia';

const state = vi.hoisted(() => ({ send: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@livekit/components-react', () => ({
  useTracks: () => [],
  useLocalParticipant: () => ({
    isMicrophoneEnabled: true,
    isCameraEnabled: false,
    isScreenShareEnabled: false,
  }),
  useLocalParticipantPermissions: () => ({
    canPublish: true,
    canPublishSources: [],
    canPublishData: true,
  }),
  useConnectionState: () => 'connected',
  useRoomContext: () => ({}),
  useChat: () => ({ send: state.send, chatMessages: [], isSending: false }),
  RoomAudioRenderer: () => <audio data-testid="audio-remoto" />,
  StartMediaButton: ({ label }: { label: string }) => <button>{label}</button>,
  TrackToggle: ({
    children,
    'aria-label': label,
  }: {
    children: React.ReactNode;
    'aria-label': string;
  }) => <button aria-label={label}>{children}</button>,
  DisconnectButton: ({
    children,
    'aria-label': label,
  }: {
    children: React.ReactNode;
    'aria-label': string;
  }) => <button aria-label={label}>{children}</button>,
}));
import { PalcoReuniao } from './PalcoReuniao';
function abrir(anfitriao = false) {
  render(
    <PalcoReuniao
      anfitriao={anfitriao}
      escolhas={MIDIA_INICIAL}
      aoMudarEscolhas={vi.fn()}
      aoFalhar={vi.fn()}
    />,
  );
}
describe('controles da sala em português', () => {
  it('oferece mídia, dispositivos, mensagens e saída sem áudio duplicado', () => {
    abrir();
    for (const nome of [
      'Desligar microfone',
      'Ativar câmera',
      'Mensagens da reunião',
      'Sair da reunião',
      'Ativar som e vídeo da reunião',
    ])
      expect(screen.getByRole('button', { name: nome })).toBeInTheDocument();
    expect(screen.getByText('Dispositivos')).toBeInTheDocument();
    expect(screen.getAllByTestId('audio-remoto')).toHaveLength(1);
  });
  it('distingue encerrar como anfitrião de sair como convidado', () => {
    abrir(true);
    expect(screen.getByRole('button', { name: 'Encerrar reunião' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sair da reunião' })).not.toBeInTheDocument();
  });
  it('envia mensagem e devolve o foco ao controle ao fechar com Escape', async () => {
    const user = userEvent.setup();
    abrir();
    await user.click(screen.getByRole('button', { name: 'Mensagens da reunião' }));
    await user.type(screen.getByLabelText('Mensagem para os participantes'), 'Podemos começar?');
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(state.send).toHaveBeenCalledWith('Podemos começar?');
    await waitFor(() =>
      expect(screen.getByLabelText('Mensagem para os participantes')).toHaveValue(''),
    );
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Mensagens da reunião' })).toHaveFocus();
    expect(screen.queryByRole('region', { name: 'Mensagens da reunião' })).not.toBeInTheDocument();
  });
  it('preserva o texto da mensagem quando o envio falha', async () => {
    state.send.mockRejectedValueOnce(new Error('falha interna'));
    const user = userEvent.setup();
    abrir();
    await user.click(screen.getByRole('button', { name: 'Mensagens da reunião' }));
    await user.type(screen.getByLabelText('Mensagem para os participantes'), 'Texto preservado');
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('A mensagem não foi enviada');
    expect(screen.getByLabelText('Mensagem para os participantes')).toHaveValue('Texto preservado');
  });
});
