import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConnectionError, DisconnectReason } from 'livekit-client';
import type { ConviteCall } from '@/lib/calls/queries';
import type * as Reconexao from '@/lib/calls/reconexao';

const sdk = vi.hoisted(() => ({
  conectar: () => {},
  erro: (_e: Error) => {},
  sair: (_reason?: DisconnectReason) => {},
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('@/lib/calls/reconexao', async (original) => ({
  ...(await original<typeof Reconexao>()),
  atrasoDaReconexao: () => 0,
}));
vi.mock('@livekit/components-react', () => ({
  LiveKitRoom: ({
    children,
    onConnected,
    onDisconnected,
    onError,
  }: {
    children: React.ReactNode;
    onConnected: () => void;
    onDisconnected: typeof sdk.sair;
    onError: typeof sdk.erro;
  }) => {
    sdk.conectar = onConnected;
    sdk.sair = onDisconnected;
    sdk.erro = onError;
    return <div data-testid="sala">{children}</div>;
  },
}));
vi.mock('./LiveCoach', () => ({ LiveCoach: () => <p>Coach privado</p> }));
vi.mock('./PalcoReuniao', async () => {
  const { useRef } = await import('react');
  const { EscreverMensagemReuniao } = await import('./EscreverMensagemReuniao');
  return {
    PalcoReuniao: function Campo() {
      const campoRef = useRef<HTMLTextAreaElement>(null);
      return (
        <EscreverMensagemReuniao
          aberto
          conectado
          campoRef={campoRef}
          enviar={() => Promise.resolve()}
          enviando={false}
          aoEnviar={() => {}}
        />
      );
    },
  };
});
import { SalaCall } from './SalaCall';

const convite: ConviteCall = {
  reuniaoId: 'r-1',
  titulo: 'Projeto de atendimento',
  tipo: 'descoberta',
  agendadaPara: '2099-08-12T18:30:00-03:00',
  duracaoMinutos: 45,
  status: 'agendada',
  liveCoachAtivo: true,
  salaProvedor: 'sala-1',
  disponivel: true,
};
const resposta = () =>
  new Response(JSON.stringify({ server_url: 'wss://example.test', participant_token: 'teste' }), {
    status: 201,
  });
async function entrar(anfitriao = false) {
  render(
    <SalaCall
      codigo="teste"
      convite={convite}
      anfitriao={anfitriao}
      nomeSugerido="Camila"
      videoConfigurado
    />,
  );
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Entrar na reunião' }));
  await screen.findByTestId('sala');
  act(() => sdk.conectar());
}
afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
});

describe('participação atravessa a reconexão', () => {
  it.each([false, true])(
    'preserva rascunho do anfitrião %s e ignora eventos da sala anterior',
    async (anfitriao) => {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(() => Promise.resolve(resposta()));
      await entrar(anfitriao);
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Escopo\nPrazo' } });
      const eventoAntigo = sdk.sair;
      act(() => {
        sdk.sair(DisconnectReason.SIGNAL_CLOSE);
        sdk.erro(ConnectionError.serverUnreachable('Falha duplicada'));
      });
      expect(screen.getByRole('heading', { name: 'Reconectando à reunião' })).toHaveFocus();
      expect(screen.getByText('Rascunho mantido nesta aba')).toBeVisible();
      await screen.findByTestId('sala');
      expect(screen.getByRole('textbox')).toHaveValue('Escopo\nPrazo');
      act(() => eventoAntigo(DisconnectReason.CLIENT_INITIATED));
      expect(screen.getByTestId('sala')).toBeVisible();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(screen.queryByText('Coach privado') !== null).toBe(anfitriao);
    },
  );
  it('permite negar câmera sem confundir isso com queda na conexão', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(resposta()));
    await entrar();
    act(() => sdk.erro(new DOMException('Permissão negada', 'NotAllowedError')));
    expect(screen.getByTestId('sala')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Permita');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('não reinicia infinitamente quando token funciona mas conexão falha', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(resposta()));
    await entrar();
    for (let i = 0; i < 3; i++) {
      act(() => sdk.erro(ConnectionError.serverUnreachable('Não conectou')));
      await screen.findByTestId('sala');
    }
    act(() => sdk.erro(ConnectionError.serverUnreachable('Não conectou')));
    expect(screen.getByRole('heading', { name: 'Não foi possível reconectar' })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(screen.queryByText('Não conectou')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByTestId('sala');
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
  it.each([false, true])(
    'sai offline sem encerrar para os outros e sem levar texto na reentrada (%s)',
    async (anfitriao) => {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(() => Promise.resolve(resposta()));
      await entrar(anfitriao);
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Rascunho da participação' },
      });
      act(() => {
        Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
        window.dispatchEvent(new Event('offline'));
        sdk.sair(DisconnectReason.SIGNAL_CLOSE);
      });
      expect(screen.getByRole('heading', { name: 'Você está sem internet' })).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Sair da reunião' }));
      if (anfitriao) fireEvent.click(screen.getByRole('button', { name: 'Sair da sala' }));
      await screen.findByRole('heading', { name: 'Você saiu da reunião' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      act(() => {
        Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
        window.dispatchEvent(new Event('online'));
      });
      fireEvent.click(screen.getByRole('button', { name: 'Voltar à entrada' }));
      fireEvent.click(screen.getByRole('button', { name: 'Entrar na reunião' }));
      await screen.findByTestId('sala');
      expect(screen.getByRole('textbox')).toHaveValue('');
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    },
  );
});
