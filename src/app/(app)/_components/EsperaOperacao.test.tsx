import { act, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { EsperaOperacao } from './EsperaOperacao';

it('não rouba o foco de um botão acionado antes do primeiro frame', () => {
  let primeiroFrame: FrameRequestCallback | undefined;
  const frame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    primeiroFrame = callback;
    return 1;
  });
  try {
    render(
      <EsperaOperacao
        aberto
        rotulo="Enriquecimento"
        titulo="Atualizando a ficha"
        descricao="Consultando os dados da empresa."
        etapas={[{ titulo: 'Consultando', descricao: 'Aguarde o resultado.' }]}
        acaoSecundaria={{ rotulo: 'Continuar usando a ficha', aoAcionar: vi.fn() }}
      />,
    );
    const botao = screen.getByRole('button', { name: 'Continuar usando a ficha' });
    botao.focus();
    expect(primeiroFrame).toBeDefined();
    act(() => primeiroFrame?.(0));
    expect(botao).toHaveFocus();
  } finally {
    frame.mockRestore();
  }
});
