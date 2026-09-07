import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AnexosDaRodada } from './AnexosDaRodada';
beforeEach(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:imagem'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
});
it('mostra a imagem selecionada e permite removê-la sem enviar', () => {
  const remover = vi.fn();
  render(
    <AnexosDaRodada
      arquivos={[new File(['imagem'], 'foto.png', { type: 'image/png' })]}
      estado="rascunho"
      aoRemover={remover}
    />,
  );
  expect(screen.getByRole('img', { name: 'foto.png' })).toHaveAttribute('src', 'blob:imagem');
  fireEvent.click(screen.getByRole('button', { name: 'Remover foto.png' }));
  expect(remover).toHaveBeenCalledWith(0);
});
