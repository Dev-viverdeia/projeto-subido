import { render, renderHook, act } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { anunciarBuscaMensagem, focarMensagem, useFocoConversa } from './focarMensagem';

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

it('abre resposta recolhida e destaca só o parágrafo encontrado, sem abrir outros painéis', () => {
  const { container, getByTestId } = render(
    <div data-leitura-conversa data-testid="leitura">
      <ol>
        <li id="sobral-mensagem-longa" tabIndex={-1}>
          <div data-texto-resposta>
            <p>Abertura</p>
            <details>
              <summary>Ler mais</summary>
              <p>O escopo está aqui.</p>
            </details>
          </div>
          <details data-recomendacao>
            <summary>Recomendação</summary>Outra coisa
          </details>
        </li>
      </ol>
    </div>,
  );
  getByTestId('leitura').scrollTo = vi.fn();
  expect(focarMensagem('longa', 'ESCOPO')).toBe(true);
  expect(container.querySelector('[data-texto-resposta] details')).toHaveAttribute('open');
  expect(container.querySelector('[data-trecho-encontrado]')).toHaveTextContent(
    'O escopo está aqui.',
  );
  expect(container.querySelector('[data-recomendacao]')).not.toHaveAttribute('open');
  focarMensagem('longa');
  expect(container.querySelector('[data-trecho-encontrado]')).toBeNull();
});

it('retém o destino apenas na conversa atual até a mensagem antiga chegar pelo RSC', () => {
  const { container, getByTestId } = render(
    <div data-leitura-conversa data-testid="leitura">
      <ol>
        <li id="sobral-mensagem-antiga" tabIndex={-1}>
          <p data-texto-usuario>Escopo anterior</p>
        </li>
      </ol>
    </div>,
  );
  getByTestId('leitura').scrollTo = vi.fn();
  const ref = { current: container.querySelector('div') };
  const { rerender } = renderHook<void, { mensagem?: string }>(
    ({ mensagem }: { mensagem?: string }) => useFocoConversa(ref, 'thread', mensagem),
    { initialProps: { mensagem: undefined } },
  );
  act(() => anunciarBuscaMensagem('thread', 'antiga', 'escopo'));
  act(() => anunciarBuscaMensagem('outra', 'antiga', 'não deve substituir'));
  rerender({ mensagem: 'antiga' });
  expect(container.querySelector('[data-trecho-encontrado]')).toHaveTextContent('Escopo anterior');
});
