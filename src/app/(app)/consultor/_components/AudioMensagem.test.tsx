import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioMensagem } from './AudioMensagem';
import { StrictMode } from 'react';

describe('AudioMensagem', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('oferece reprodução, progresso e remoção como uma mensagem nativa', () => {
    const remover = vi.fn();
    render(
      <AudioMensagem
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
        estado="Pronto para enviar"
        aoRemover={remover}
      />,
    );

    expect(screen.getByText('Mensagem de áudio')).toBeVisible();
    expect(screen.getByText('Pronto para enviar')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reproduzir áudio' })).toBeEnabled();
    expect(screen.getByRole('slider', { name: 'Posição do áudio' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Remover mensagem de áudio' }));
    expect(remover).toHaveBeenCalledOnce();
  });

  it('não usa uma URL revogada quando React remonta os efeitos', () => {
    let sequencia = 0;
    const revogadas = new Set<string>();
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => `blob:audio-${++sequencia}`),
        revokeObjectURL: vi.fn((url: string) => revogadas.add(url)),
      }),
    );
    const { container, unmount } = render(
      <StrictMode>
        <AudioMensagem arquivo={new File(['som'], 'fala.webm', { type: 'audio/webm' })} />
      </StrictMode>,
    );
    const origem = container.querySelector('audio')!.getAttribute('src')!;
    expect(origem).toMatch(/^blob:/);
    expect(revogadas.has(origem)).toBe(false);
    unmount();
    expect(revogadas.has(origem)).toBe(true);
    expect(revogadas.size).toBe(sequencia);
  });

  it('mantém o controle finito quando a gravação não informa duração', () => {
    const { container } = render(<AudioMensagem src="/audio" />);
    const audio = container.querySelector('audio')!;
    Object.defineProperty(audio, 'duration', { value: Infinity, configurable: true });
    fireEvent.loadedMetadata(audio);
    expect(screen.getByRole('slider')).toHaveAttribute('max', '0');
    expect(screen.getByRole('slider')).toBeDisabled();
  });

  it('permite recarregar o áudio após falha e recupera a reprodução', () => {
    const load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    const { container } = render(<AudioMensagem src="/audio" />);
    fireEvent.error(container.querySelector('audio')!);
    fireEvent.click(screen.getByRole('button', { name: 'Tentar carregar áudio novamente' }));
    expect(load).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Reproduzir áudio' })).toBeEnabled();
  });
});
