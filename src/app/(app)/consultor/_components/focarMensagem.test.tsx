import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { focarMensagem } from './focarMensagem';

it('foca a origem e rola somente a área de leitura', () => {
  const leitura = vi.fn();
  const pagina = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const { getByTestId } = render(
    <div data-leitura-conversa data-testid="leitura">
      <ol>
        <li id="sobral-mensagem-origem" tabIndex={-1}>
          Original
        </li>
      </ol>
    </div>,
  );
  getByTestId('leitura').scrollTo = leitura;
  expect(focarMensagem('origem')).toBe(true);
  expect(document.activeElement?.id).toBe('sobral-mensagem-origem');
  expect(leitura).toHaveBeenCalledWith({ top: -16, behavior: 'instant' });
  expect(pagina).not.toHaveBeenCalled();
  pagina.mockRestore();
});
it('origem fora da janela ou fora do chat não move a página', () => {
  render(<p id="sobral-mensagem-fora">Fora do chat</p>);
  expect(focarMensagem('ausente')).toBe(false);
  expect(focarMensagem('fora')).toBe(false);
});
