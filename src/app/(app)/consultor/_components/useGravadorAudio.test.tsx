import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useGravadorAudio } from './useGravadorAudio';

const microfone = vi.fn();
const pararTrilha = vi.fn();
const stream = { getTracks: () => [{ stop: pararTrilha }] };
const gravadores: Gravador[] = [];
class Gravador {
  static isTypeSupported = () => true;
  state = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() {
    gravadores.push(this);
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['voz']) });
    this.onstop?.();
  }
}
beforeEach(() => {
  vi.clearAllMocks();
  gravadores.length = 0;
  vi.stubGlobal('MediaRecorder', Gravador);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: microfone },
  });
  microfone.mockResolvedValue(stream);
});
afterEach(() => vi.unstubAllGlobals());

it('encerra o microfone se a permissão chega depois de sair da conversa', async () => {
  let autorizar!: (s: typeof stream) => void;
  microfone.mockReturnValue(
    new Promise((r) => {
      autorizar = r;
    }),
  );
  const concluir = vi.fn();
  const { result, unmount } = renderHook(() =>
    useGravadorAudio({ aoConcluir: concluir, aoFalhar: vi.fn() }),
  );
  let pedido!: Promise<void>;
  act(() => {
    pedido = result.current.alternar();
  });
  unmount();
  await act(async () => {
    autorizar(stream);
    await pedido;
  });
  expect(pararTrilha).toHaveBeenCalledOnce();
  expect(gravadores).toHaveLength(0);
  expect(concluir).not.toHaveBeenCalled();
});

it('cliques rápidos pedem apenas uma permissão de microfone', async () => {
  let autorizar!: (s: typeof stream) => void;
  microfone.mockReturnValue(
    new Promise((r) => {
      autorizar = r;
    }),
  );
  const { result } = renderHook(() => useGravadorAudio({ aoConcluir: vi.fn(), aoFalhar: vi.fn() }));
  let primeiro!: Promise<void>;
  act(() => {
    primeiro = result.current.alternar();
    void result.current.alternar();
  });
  await act(async () => {
    autorizar(stream);
    await primeiro;
  });
  expect(microfone).toHaveBeenCalledOnce();
  expect(gravadores).toHaveLength(1);
});

it('cancelar descarta somente a gravação e libera o microfone', async () => {
  const concluir = vi.fn();
  const { result } = renderHook(() =>
    useGravadorAudio({ aoConcluir: concluir, aoFalhar: vi.fn() }),
  );
  await act(async () => {
    await result.current.alternar();
  });
  // A operação é pública para o botão de descartar; nunca entrega um áudio descartado.
  act(() => {
    result.current.cancelar();
  });
  expect(result.current.gravando).toBe(false);
  expect(pararTrilha).toHaveBeenCalled();
  expect(concluir).not.toHaveBeenCalled();
});

it('parar conclui um áudio válido e libera o microfone', async () => {
  const concluir = vi.fn();
  const { result } = renderHook(() =>
    useGravadorAudio({ aoConcluir: concluir, aoFalhar: vi.fn() }),
  );
  await act(async () => {
    await result.current.alternar();
  });
  await act(async () => {
    await result.current.alternar();
  });
  expect(result.current.gravando).toBe(false);
  expect(concluir).toHaveBeenCalledOnce();
  expect(concluir.mock.calls[0]![0]).toMatchObject({ type: 'audio/webm', size: 3 });
  expect(pararTrilha).toHaveBeenCalled();
});
