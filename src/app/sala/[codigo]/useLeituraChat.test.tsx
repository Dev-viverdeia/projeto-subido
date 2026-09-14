import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLeituraChat } from './useLeituraChat';

let notificarFim: IntersectionObserverCallback;
let notificarTamanho: ResizeObserverCallback;
const desconectar = vi.fn();
const desconectarTamanho = vi.fn();
beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        notificarFim = callback;
      }
      observe = vi.fn();
      disconnect = desconectar;
    },
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        notificarTamanho = callback;
      }
      observe = vi.fn();
      disconnect = desconectarTamanho;
    },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function avisarFim(visivel: boolean) {
  act(() =>
    notificarFim(
      [{ isIntersecting: visivel } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );
}
function Harness({ aberto, quantidade }: { aberto: boolean; quantidade: number }) {
  const { mensagens, conteudo, fim, novas, afastado, guardarPosicao, irParaRecentes } =
    useLeituraChat(aberto, quantidade);
  return (
    <>
      <div ref={mensagens} data-testid="lista" hidden={!aberto}>
        <div ref={conteudo}>
          <div ref={fim} />
        </div>
      </div>
      <output>
        {novas} novas; {afastado ? 'acima' : 'fim'}
      </output>
      <button onClick={guardarPosicao}>Guardar</button>
      <button onClick={irParaRecentes}>Recentes</button>
    </>
  );
}
function montar() {
  const view = render(<Harness aberto quantidade={10} />);
  const lista = screen.getByTestId('lista');
  Object.defineProperty(lista, 'scrollHeight', { configurable: true, value: 1000 });
  lista.scrollTop = 1000;
  avisarFim(true);
  return { ...view, lista };
}

describe('leitura contínua do chat', () => {
  it('não puxa a leitura quando o resize chega antes do evento de interseção', () => {
    const { lista } = montar();
    lista.scrollTop = 180;
    act(() => notificarTamanho([], {} as ResizeObserver));
    expect(lista.scrollTop).toBe(180);
    expect(screen.getByRole('status')).toHaveTextContent('acima');
    avisarFim(true); // Evento atrasado, medido antes da rolagem da pessoa.
    expect(screen.getByRole('status')).toHaveTextContent('acima');
  });
  it('respeita rolagem anterior ao recebimento mesmo com interseção atrasada', () => {
    const { rerender, lista } = montar();
    lista.scrollTop = 180;
    rerender(<Harness aberto quantidade={11} />);
    expect(lista.scrollTop).toBe(180);
    avisarFim(false);
    expect(screen.getByRole('status')).toHaveTextContent('1 novas; acima');
  });
  it('acompanha o fim quando aumentar a janela limita o scrollTop automaticamente', () => {
    const { lista } = montar();
    Object.defineProperty(lista, 'clientHeight', { configurable: true, value: 200 });
    lista.scrollTop = 800;
    act(() => notificarTamanho([], {} as ResizeObserver));
    expect(screen.getByRole('status')).toHaveTextContent('fim');
  });
  it('acompanha novas mensagens quando o fim está visível', async () => {
    const { rerender, lista } = montar();
    rerender(<Harness aberto quantidade={11} />);
    expect(lista.scrollTop).toBe(1000);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('0 novas; fim'));
  });
  it('mantém a posição e acumula mensagens quando a pessoa lê acima', () => {
    const { rerender, lista } = montar();
    lista.scrollTop = 180;
    avisarFim(false);
    rerender(<Harness aberto quantidade={12} />);
    expect(lista.scrollTop).toBe(180);
    expect(screen.getByRole('status')).toHaveTextContent('2 novas; acima');
  });
  it('fecha sem marcar como lidas e retoma o mesmo ponto ao reabrir', () => {
    const { rerender, lista } = montar();
    lista.scrollTop = 230;
    avisarFim(false);
    act(() => screen.getByText('Guardar').click());
    rerender(<Harness aberto={false} quantidade={12} />);
    lista.scrollTop = 0; // Alguns layouts removem a caixa de rolagem enquanto está oculta.
    rerender(<Harness aberto quantidade={13} />);
    avisarFim(false);
    expect(lista.scrollTop).toBe(230);
    expect(screen.getByRole('status')).toHaveTextContent('3 novas; acima');
  });
  it('limpa o aviso ao voltar pelo controle e volta a acompanhar', async () => {
    const { rerender, lista } = montar();
    avisarFim(false);
    rerender(<Harness aberto quantidade={12} />);
    act(() => screen.getByText('Recentes').click());
    expect(lista.scrollTop).toBe(1000);
    expect(screen.getByRole('status')).toHaveTextContent('0 novas; fim');
    Object.defineProperty(lista, 'scrollHeight', { configurable: true, value: 1200 });
    rerender(<Harness aberto quantidade={13} />);
    expect(lista.scrollTop).toBe(1200);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('0 novas; fim'));
  });
  it('considera lidas ao chegar manualmente ao fim', () => {
    const { rerender } = montar();
    avisarFim(false);
    rerender(<Harness aberto quantidade={14} />);
    avisarFim(true);
    expect(screen.getByRole('status')).toHaveTextContent('0 novas; fim');
  });
  it('redimensionamento só acompanha quem já está no fim', () => {
    const { lista } = montar();
    act(() => notificarTamanho([], {} as ResizeObserver));
    expect(lista.scrollTop).toBe(1000);
    avisarFim(false);
    lista.scrollTop = 120;
    act(() => notificarTamanho([], {} as ResizeObserver));
    expect(lista.scrollTop).toBe(120);
  });
  it('envio resolvido com painel fechado não marca mensagens como lidas', () => {
    const { rerender, lista } = montar();
    rerender(<Harness aberto={false} quantidade={11} />);
    lista.scrollTop = 120;
    act(() => screen.getByText('Recentes').click());
    expect(lista.scrollTop).toBe(120);
    expect(screen.getByRole('status')).toHaveTextContent('1 novas');
  });
  it('desconecta os observadores ao fechar ou desmontar', () => {
    const { rerender, unmount } = montar();
    rerender(<Harness aberto={false} quantidade={10} />);
    expect(desconectar).toHaveBeenCalledTimes(1);
    expect(desconectarTamanho).toHaveBeenCalledTimes(1);
    rerender(<Harness aberto quantidade={10} />);
    unmount();
    expect(desconectar).toHaveBeenCalledTimes(2);
    expect(desconectarTamanho).toHaveBeenCalledTimes(2);
  });
});
