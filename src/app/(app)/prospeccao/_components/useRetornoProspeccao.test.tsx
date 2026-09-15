import { act, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useRetornoProspeccao } from './useRetornoProspeccao';
import { consumirRetornoProspeccao } from '@/lib/prospeccao/retorno-local';

vi.mock('@/lib/prospeccao/retorno-local', () => ({ consumirRetornoProspeccao: vi.fn() }));
const lista = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const empresa = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const scrollOriginal = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');

function Lista({ alvo }: { alvo?: string }) {
  const ref = useRetornoProspeccao(lista, alvo);
  return (
    <div ref={ref}>
      <article>
        <h3 id={`empresa-${empresa}`}>Empresa</h3>
        <a href="/ficha" data-retorno-ficha>
          Abrir ficha
        </a>
      </article>
    </div>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (scrollOriginal) Object.defineProperty(Element.prototype, 'scrollIntoView', scrollOriginal);
  else Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
});

it('não perde a posição ao receber o alvo do servidor depois da lista em cache', () => {
  let frame: FrameRequestCallback | undefined;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frame = cb;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const rolar = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const ancora = vi.fn();
  Object.defineProperty(Element.prototype, 'scrollIntoView', { value: ancora, configurable: true });
  vi.mocked(consumirRetornoProspeccao)
    .mockReturnValueOnce({ lista, empresa, topo: 0, largura: innerWidth, em: Date.now() })
    .mockReturnValue(null);
  const view = render(<Lista />);
  act(() => frame?.(0));
  const chamadasAncora = ancora.mock.calls.length;
  expect(rolar).toHaveBeenCalledTimes(1);
  view.rerender(<Lista alvo={empresa} />);
  act(() => frame?.(1));
  expect(rolar).toHaveBeenCalledTimes(1);
  expect(ancora).toHaveBeenCalledTimes(chamadasAncora);
});
