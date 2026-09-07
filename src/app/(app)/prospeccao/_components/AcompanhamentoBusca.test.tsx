import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({ refresh: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
import { AcompanhamentoBusca } from './AcompanhamentoBusca';

const busca = {
  quantidade: 5,
  etapa: 1,
  detalhe: null,
  segmento: 'Clínicas',
  localizacao: 'Recife',
  encontradas: 0,
};

describe('Acompanhamento da lista', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  });
  afterEach(() => vi.useRealTimers());

  it('troca o loading pela falha sem esperar outra navegação', () => {
    const { rerender } = render(<AcompanhamentoBusca {...busca} status="processando" />);
    expect(screen.getByRole('dialog', { name: 'Montando sua lista' })).toBeVisible();
    rerender(<AcompanhamentoBusca {...busca} status="falhou" />);
    expect(screen.getByRole('alertdialog')).toHaveTextContent('5 devolvidos ao saldo');
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('pausa as consultas offline e retoma assim que a conexão volta', () => {
    vi.useFakeTimers();
    render(<AcompanhamentoBusca {...busca} status="processando" />);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    fireEvent(window, new Event('offline'));
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(router.refresh).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toHaveTextContent('Sem conexão');
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    fireEvent(window, new Event('online'));
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });

  it('acompanha uma lista reaberta sem bloquear a tela e para após concluir', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <AcompanhamentoBusca {...busca} status="processando" minimizadoInicial />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver andamento' })).toBeVisible();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(router.refresh).toHaveBeenCalledTimes(1);
    rerender(
      <AcompanhamentoBusca {...busca} status="concluida" encontradas={4} minimizadoInicial />,
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('4 de 5 solicitadas');
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });

  it('não reabre o resultado de uma lista antiga ao consultar o histórico', () => {
    render(<AcompanhamentoBusca {...busca} status="falhou" minimizadoInicial />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('fecha o resultado da retomada mesmo sem parâmetro de busca na URL', () => {
    const { rerender } = render(
      <AcompanhamentoBusca {...busca} status="processando" minimizadoInicial />,
    );
    rerender(<AcompanhamentoBusca {...busca} status="falhou" minimizadoInicial />);
    expect(screen.getByRole('alertdialog')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /^Fechar$/ }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    rerender(<AcompanhamentoBusca {...busca} status="falhou" minimizadoInicial />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
