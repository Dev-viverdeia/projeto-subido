import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioMensagem } from './AudioMensagem';

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
});
