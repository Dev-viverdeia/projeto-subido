import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ConviteCall } from '@/lib/calls/queries';
import { DisconnectReason } from 'livekit-client';
import type * as Reconexao from '@/lib/calls/reconexao';

const conexao = vi.hoisted(() => ({ desconectar: (_reason?: number) => {}, navegar: vi.fn() }));

vi.mock('@/lib/calls/reconexao', async (importOriginal) => ({
  ...(await importOriginal<typeof Reconexao>()),
  atrasoDaReconexao: () => 0,
}));

vi.mock('@livekit/components-react', () => ({
  LiveKitRoom: ({
    children,
    onDisconnected,
    onMediaDeviceFailure,
    audio,
    video,
  }: {
    children: React.ReactNode;
    onDisconnected?: (reason?: number) => void;
    onMediaDeviceFailure?: (failure: string, kind: string) => void;
    audio?: unknown;
    video?: unknown;
  }) => {
    conexao.desconectar = (reason) => onDisconnected?.(reason);
    return (
      <div data-testid="sala-livekit" data-audio={Boolean(audio)} data-video={Boolean(video)}>
        {children}
        <button type="button" onClick={() => onDisconnected?.(9)}>
          Simular queda de conexão
        </button>
        <button
          type="button"
          onClick={() => onMediaDeviceFailure?.('PermissionDenied', 'audioinput')}
        >
          Simular microfone bloqueado
        </button>
      </div>
    );
  },
  RoomAudioRenderer: () => <audio data-testid="audio-remoto" />,
  // O prefab já inclui RoomAudioRenderer. Uma segunda instância duplica a voz remota.
  VideoConference: () => (
    <div>
      Palco da reunião
      <audio data-testid="audio-remoto" />
    </div>
  ),
}));

vi.mock('./LiveCoach', () => ({ LiveCoach: () => <aside>Live Coach</aside> }));
vi.mock('./PalcoReuniao', () => ({
  PalcoReuniao: ({
    aoSair,
    aoEncerrar,
  }: {
    aoSair?: () => Promise<void>;
    aoEncerrar?: () => Promise<void>;
  }) => (
    <div>
      Palco da reunião
      <audio data-testid="audio-remoto" />
      <button
        onClick={() => {
          void (aoSair?.() ?? Promise.resolve()).then(() =>
            conexao.desconectar(DisconnectReason.CLIENT_INITIATED),
          );
        }}
      >
        Simular saída voluntária
      </button>
      {aoEncerrar && (
        <button
          onClick={() => {
            void aoEncerrar().then(() => conexao.desconectar(DisconnectReason.CLIENT_INITIATED));
          }}
        >
          Simular confirmação de encerramento
        </button>
      )}
    </div>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: conexao.navegar }),
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
  it('volta à entrada sem reutilizar a câmera e o microfone da participação anterior', async () => {
    const user = userEvent.setup();
    const original = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
    const track = Object.assign(new EventTarget(), {
      stop: vi.fn(),
      getSettings: () => ({ deviceId: 'dispositivo-teste' }),
    });
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [track] });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: Object.assign(new EventTarget(), {
        getUserMedia,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      }),
    });
    const playMock = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            server_url: 'wss://livekit.example.test',
            participant_token: 'teste',
          }),
          { status: 201 },
        ),
      ),
    );
    const view = render(
      <SalaCall
        codigo="codigo-1"
        convite={CONVITE}
        anfitriao={false}
        nomeSugerido="Camila"
        videoConfigurado
      />,
    );
    try {
      await user.click(screen.getByRole('button', { name: 'Testar câmera e microfone' }));
      expect(await screen.findByRole('button', { name: 'Desligar câmera' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: 'Desligar microfone' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: 'Entrar na reunião' }));
      const primeiraEntrada = await screen.findByTestId('sala-livekit');
      expect(primeiraEntrada).toHaveAttribute('data-audio', 'true');
      expect(primeiraEntrada).toHaveAttribute('data-video', 'true');
      await user.click(screen.getByRole('button', { name: 'Simular saída voluntária' }));
      await user.click(await screen.findByRole('button', { name: 'Voltar à entrada' }));
      expect(screen.getByText('Câmera desligada')).toBeVisible();
      expect(screen.getByLabelText('Sua prévia de câmera')).not.toBeVisible();
      await user.click(screen.getByRole('button', { name: 'Entrar na reunião' }));
      const segundaEntrada = await screen.findByTestId('sala-livekit');
      expect(segundaEntrada).toHaveAttribute('data-audio', 'false');
      expect(segundaEntrada).toHaveAttribute('data-video', 'false');
      expect(getUserMedia).toHaveBeenCalledTimes(2);
      expect(track.stop).toHaveBeenCalled();
    } finally {
      view.unmount();
      fetchMock.mockRestore();
      playMock.mockRestore();
      if (original) Object.defineProperty(navigator, 'mediaDevices', original);
      else Reflect.deleteProperty(navigator, 'mediaDevices');
    }
  });

  it('mesmo após falha de reconexão exige a escolha explícita para encerrar', async () => {
    const user = userEvent.setup();
    let entradas = 0;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.endsWith('/finalizar'))
        return Promise.resolve(new Response('{}', { status: 202 }));
      if (entradas++ > 0) return Promise.reject(new Error('Sem conexão'));
      return Promise.resolve(
        new Response(
          JSON.stringify({ server_url: 'wss://livekit.example.test', participant_token: 'teste' }),
          { status: 201 },
        ),
      );
    });
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
    await user.click(await screen.findByRole('button', { name: 'Sair da reunião' }));
    await user.click(screen.getByRole('button', { name: 'Voltar à reunião' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(([url]) => typeof url === 'string' && url.endsWith('/finalizar')),
    ).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Sair da reunião' }));
    await user.click(screen.getByRole('button', { name: 'Encerrar para todos' }));
    expect(await screen.findByRole('heading', { name: 'Encerramento solicitado' })).toBeVisible();
    expect(JSON.parse(fetchMock.mock.calls.at(-1)![1]!.body as string)).toMatchObject({
      encerrar: true,
    });
    fetchMock.mockRestore();
  });
  it.each([true, false])(
    'saída voluntária do anfitrião %s não encerra a sala nem promete resumo',
    async (anfitriao) => {
      const user = userEvent.setup();
      conexao.navegar.mockClear();
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              server_url: 'wss://livekit.example.test',
              participant_token: 'teste',
            }),
            { status: 201 },
          ),
        ),
      );
      render(
        <SalaCall
          codigo="codigo-1"
          convite={CONVITE}
          anfitriao={anfitriao}
          nomeSugerido="Rafael"
          videoConfigurado
        />,
      );
      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: 'Entrar na reunião' }));
      await user.click(await screen.findByRole('button', { name: 'Simular saída voluntária' }));
      expect(await screen.findByRole('heading', { name: 'Você saiu da reunião' })).toBeVisible();
      expect(screen.queryByText('Conversa salva.')).not.toBeInTheDocument();
      expect(screen.queryByText('Encerramento solicitado')).not.toBeInTheDocument();
      const salvamentos = fetchMock.mock.calls.filter(
        ([url]) => typeof url === 'string' && url.endsWith('/finalizar'),
      );
      expect(salvamentos).toHaveLength(anfitriao ? 1 : 0);
      if (anfitriao)
        expect(JSON.parse(salvamentos[0]![1]!.body as string)).toMatchObject({ encerrar: false });
      const chamadas = fetchMock.mock.calls.length;
      await user.click(screen.getByRole('button', { name: 'Voltar à entrada' }));
      expect(screen.getByRole('button', { name: 'Entrar na reunião' })).toBeVisible();
      expect(fetchMock).toHaveBeenCalledTimes(chamadas);
      expect(conexao.navegar).not.toHaveBeenCalled();
      fetchMock.mockRestore();
    },
  );

  it('só anuncia encerramento solicitado depois da confirmação do servidor', async () => {
    const user = userEvent.setup();
    let confirmar!: (response: Response) => void;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (typeof url === 'string' && url.endsWith('/finalizar'))
        return new Promise<Response>((resolve) => {
          confirmar = resolve;
        });
      return new Response(
        JSON.stringify({ server_url: 'wss://livekit.example.test', participant_token: 'teste' }),
        { status: 201 },
      );
    });
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
    await user.click(
      await screen.findByRole('button', { name: 'Simular confirmação de encerramento' }),
    );
    expect(screen.getByTestId('sala-livekit')).toBeVisible();
    expect(screen.queryByText('Encerramento solicitado')).not.toBeInTheDocument();
    await act(async () => {
      confirmar(new Response('{}', { status: 202 }));
      await Promise.resolve();
    });
    expect(screen.getByRole('heading', { name: 'Encerramento solicitado' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Voltar à entrada' })).not.toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls.at(-1)![1]!.body as string)).toMatchObject({
      encerrar: true,
    });
    fetchMock.mockRestore();
  });

  it('remoção pelo provedor não afirma que todos saíram ou que foi uma saída voluntária', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            server_url: 'wss://livekit.example.test',
            participant_token: 'teste',
          }),
          { status: 201 },
        ),
      ),
    );
    render(
      <SalaCall
        codigo="codigo-1"
        convite={CONVITE}
        anfitriao={false}
        nomeSugerido="Camila"
        videoConfigurado
      />,
    );
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Entrar na reunião' }));
    await screen.findByTestId('sala-livekit');
    act(() => conexao.desconectar(DisconnectReason.PARTICIPANT_REMOVED));
    expect(screen.getByRole('heading', { name: 'Sua participação foi encerrada' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Voltar à entrada' })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockRestore();
  });
});
