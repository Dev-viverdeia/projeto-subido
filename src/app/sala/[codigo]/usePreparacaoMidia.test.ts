import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { orientacaoMidia, usePreparacaoMidia } from './usePreparacaoMidia';

function stream(id = 'camera-1') {
  const track = Object.assign(new EventTarget(), {
    stop: vi.fn(),
    getSettings: () => ({ deviceId: id }),
  });
  return { media: { getTracks: () => [track] } as unknown as MediaStream, track };
}
const original = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
afterEach(() => {
  if (original) Object.defineProperty(navigator, 'mediaDevices', original);
  else Reflect.deleteProperty(navigator, 'mediaDevices');
});
function configurar(getUserMedia = vi.fn()) {
  const devices = Object.assign(new EventTarget(), {
    getUserMedia,
    enumerateDevices: vi.fn().mockResolvedValue([]),
  });
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: devices });
  return devices;
}

describe('preparação local da reunião', () => {
  it('não pede permissões nem abre dispositivos ao carregar', () => {
    const devices = configurar();
    const { result, unmount } = renderHook(usePreparacaoMidia);
    expect(devices.getUserMedia).not.toHaveBeenCalled();
    expect(result.current.escolhas.audio).toBe(false);
    expect(result.current.escolhas.video).toBe(false);
    unmount();
  });
  it('preserva o microfone quando a câmera está bloqueada', async () => {
    const audio = stream('microfone-1');
    configurar(
      vi
        .fn()
        .mockImplementation(({ video }) =>
          video
            ? Promise.reject(new DOMException('bloqueado', 'NotAllowedError'))
            : Promise.resolve(audio.media),
        ),
    );
    const { result } = renderHook(usePreparacaoMidia);
    await act(async () => {
      await Promise.all([result.current.ativar('audio'), result.current.ativar('video')]);
    });
    expect(result.current.escolhas).toEqual({
      audio: true,
      video: false,
      microfoneId: 'microfone-1',
      cameraId: '',
    });
    expect(result.current.erros.video).toContain('Permita a câmera');
    expect(result.current.erros.audio).toBe('');
  });
  it('libera a câmera anterior na troca e desliga a trilha ao sair', async () => {
    const primeira = stream('camera-1');
    const segunda = stream('camera-2');
    const devices = configurar(
      vi.fn().mockResolvedValueOnce(primeira.media).mockResolvedValueOnce(segunda.media),
    );
    const { result, unmount } = renderHook(usePreparacaoMidia);
    await act(async () => {
      await result.current.ativar('video');
    });
    await act(async () => {
      result.current.selecionar('video', 'camera-2');
      await Promise.resolve();
    });
    expect(primeira.track.stop).toHaveBeenCalledOnce();
    expect(result.current.escolhas.cameraId).toBe('camera-2');
    expect(devices.getUserMedia).toHaveBeenLastCalledWith({
      audio: false,
      video: { deviceId: { exact: 'camera-2' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    unmount();
    expect(segunda.track.stop).toHaveBeenCalledOnce();
  });
  it('cancela uma permissão pendente sem reacender a câmera depois', async () => {
    const camera = stream();
    let resolver!: (value: MediaStream) => void;
    configurar(
      vi.fn().mockImplementation(
        () =>
          new Promise<MediaStream>((resolve) => {
            resolver = resolve;
          }),
      ),
    );
    const { result } = renderHook(usePreparacaoMidia);
    let pedido!: Promise<void>;
    act(() => {
      pedido = result.current.ativar('video');
    });
    act(() => result.current.desligar('video'));
    await act(async () => {
      resolver(camera.media);
      await pedido;
    });
    expect(camera.track.stop).toHaveBeenCalledOnce();
    expect(result.current.escolhas.video).toBe(false);
    expect(result.current.streams.video).toBeNull();
  });
  it('libera uma permissão que responde após desmontar a página', async () => {
    const camera = stream();
    let resolver!: (value: MediaStream) => void;
    configurar(
      vi.fn().mockImplementation(
        () =>
          new Promise<MediaStream>((resolve) => {
            resolver = resolve;
          }),
      ),
    );
    const { result, unmount } = renderHook(usePreparacaoMidia);
    let pedido!: Promise<void>;
    act(() => {
      pedido = result.current.ativar('video');
    });
    unmount();
    await act(async () => {
      resolver(camera.media);
      await pedido;
    });
    expect(camera.track.stop).toHaveBeenCalledOnce();
  });
  it('reflete um dispositivo removido e mantém a seleção desligada sem capturar', async () => {
    const camera = stream();
    const devices = configurar(vi.fn().mockResolvedValue(camera.media));
    const { result } = renderHook(usePreparacaoMidia);
    await act(async () => {
      await result.current.ativar('video');
    });
    act(() => {
      camera.track.dispatchEvent(new Event('ended'));
    });
    expect(result.current.escolhas.video).toBe(false);
    expect(result.current.erros.video).toContain('desconectado');
    act(() => result.current.selecionar('video', 'camera-2'));
    expect(devices.getUserMedia).toHaveBeenCalledOnce();
  });
  it.each(['NotAllowedError', 'NotFoundError', 'NotReadableError', 'desconhecido'])(
    'humaniza falha %s sem expor o erro bruto',
    (name) => {
      const erro = new Error('segredo-técnico');
      erro.name = name;
      expect(orientacaoMidia(erro, 'audio')).toContain('microfone');
      expect(orientacaoMidia(erro, 'audio')).not.toContain('segredo-técnico');
    },
  );
});
