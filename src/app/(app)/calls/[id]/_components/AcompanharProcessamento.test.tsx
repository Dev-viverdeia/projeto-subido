import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EstadoResumo } from '@/lib/calls/estado-resumo';
const { router } = vi.hoisted(() => ({ router: { refresh: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
import { AcompanharProcessamento } from './AcompanharProcessamento';

const estado: EstadoResumo = {
  tipo: 'processando',
  rotulo: 'Em processamento',
  titulo: 'Preparando o resumo da conversa.',
  apoio: 'Você pode voltar depois.',
  acompanhar: true,
};
const props = { estado, reuniaoId: 'reuniao-1', oportunidadeId: 'venda-1' };
const esperar = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
beforeEach(() => {
  vi.useFakeTimers();
  router.refresh.mockReset();
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('acompanhamento sem progresso fictício ou cobrança', () => {
  it('consulta a cada 15s, sem etapas inventadas, e interrompe após 3 minutos', async () => {
    render(<AcompanharProcessamento {...props} />);
    expect(router.refresh).not.toHaveBeenCalled();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    for (let i = 0; i < 12; i++) await esperar(15_000);
    expect(router.refresh).toHaveBeenCalledTimes(11);
    expect(
      screen.getByRole('heading', { name: 'A consulta automática foi pausada.' }),
    ).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await esperar(300_000);
    expect(router.refresh).toHaveBeenCalledTimes(11);
    fireEvent.click(screen.getByRole('button', { name: 'Verificar novamente' }));
    expect(router.refresh).toHaveBeenCalledTimes(12);
    await esperar(60_000);
    expect(router.refresh).toHaveBeenCalledTimes(12);
  });
  it('suspende consultas em segundo plano e offline, sem acumular requisições', async () => {
    render(<AcompanharProcessamento {...props} />);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    await esperar(30_000);
    expect(router.refresh).not.toHaveBeenCalled();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    fireEvent(window, new Event('offline'));
    expect(screen.getByRole('button', { name: 'Verificar novamente' })).toBeDisabled();
    expect(screen.getByRole('heading', { name: 'Você está sem conexão.' })).toBeVisible();
    await esperar(30_000);
    expect(router.refresh).not.toHaveBeenCalled();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    fireEvent(window, new Event('online'));
    await esperar(15_000);
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });
  it('limpa o timer ao sair e não reinicia o prazo quando recebe dados novos', async () => {
    const { rerender, unmount } = render(<AcompanharProcessamento {...props} />);
    await esperar(150_000);
    rerender(<AcompanharProcessamento {...props} estado={{ ...estado, tipo: 'retentativa' }} />);
    await esperar(30_000);
    expect(
      screen.getByRole('heading', { name: 'A consulta automática foi pausada.' }),
    ).toBeVisible();
    const vezes = router.refresh.mock.calls.length;
    unmount();
    await esperar(60_000);
    expect(router.refresh).toHaveBeenCalledTimes(vezes);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('sem job não consulta automaticamente e abre suporte com rota e assunto seguro', async () => {
    render(
      <AcompanharProcessamento
        {...props}
        estado={{ ...estado, tipo: 'sem_resumo', acompanhar: false }}
      />,
    );
    await esperar(60_000);
    expect(router.refresh).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    const href = screen.getByRole('link', { name: 'Pedir ajuda' }).getAttribute('href')!;
    expect(new URL(href, 'https://example.test').searchParams.get('origem')).toBe(
      '/reunioes/reuniao-1',
    );
    expect(href).toContain('contexto=resumo_reuniao');
    fireEvent.click(screen.getByRole('button', { name: 'Verificar novamente' }));
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });
});
