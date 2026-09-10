import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useBuscaGlobal } from './useBuscaGlobal';
const dono = '11111111-1111-4111-8111-111111111111';
const mensagem = (id: string) => ({
  id,
  conversa: 'conversa',
  titulo: 'Entrega',
  papel: 'consultor',
  trecho: 'Escopo',
  criadoEm: '2026-09-10T12:00:00Z',
});
const resposta = (ids: string[], mais = false) => ({
  ok: true,
  json: () => Promise.resolve({ mensagens: ids.map(mensagem), mais }),
});
const fetchMock = vi.fn();
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('não busca ao abrir, debouceia e cancela o pedido ao desmontar', async () => {
  fetchMock.mockReturnValue(new Promise(() => {}));
  const { result, unmount } = renderHook(() => useBuscaGlobal(dono));
  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(fetchMock).not.toHaveBeenCalled();
  act(() => result.current.pesquisar('a'));
  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(fetchMock).not.toHaveBeenCalled();
  act(() => result.current.pesquisar('escopo'));
  await act(() => vi.advanceTimersByTimeAsync(249));
  expect(fetchMock).not.toHaveBeenCalled();
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, opcoes] = fetchMock.mock.calls[0]! as [string, RequestInit];
  expect(url).toContain('/api/consultor/historico/busca?');
  expect(url).toContain('dono=' + dono);
  expect(opcoes.cache).toBe('no-store');
  unmount();
  expect(opcoes.signal?.aborted).toBe(true);
});
it('pagina, remove duplicados e ignora resposta tardia de outro termo', async () => {
  fetchMock
    .mockResolvedValueOnce(resposta(['1'], true))
    .mockResolvedValueOnce(resposta(['1', '2']));
  const { result } = renderHook(() => useBuscaGlobal(dono));
  act(() => result.current.pesquisar('escopo'));
  await act(() => vi.advanceTimersByTimeAsync(250));
  act(() => result.current.mais());
  await act(() => vi.advanceTimersByTimeAsync(250));
  expect(result.current.resultado?.mensagens.map((m) => m.id)).toEqual(['1', '2']);
  expect(fetchMock.mock.calls[1]?.[0]).toContain('pagina=1');
  let resolver!: (valor: unknown) => void;
  fetchMock
    .mockReturnValueOnce(
      new Promise((r) => {
        resolver = r;
      }),
    )
    .mockResolvedValueOnce(resposta(['nova']));
  act(() => result.current.pesquisar('antiga'));
  await act(() => vi.advanceTimersByTimeAsync(250));
  act(() => result.current.pesquisar('nova'));
  expect(result.current.resultado).toBeNull();
  await act(() => vi.advanceTimersByTimeAsync(250));
  await act(async () => {
    resolver(resposta(['antiga']));
    await Promise.resolve();
  });
  expect(result.current.resultado?.mensagens[0]?.id).toBe('nova');
});
it('permite retry da mesma página e apaga resultados se a sessão mudou', async () => {
  fetchMock
    .mockResolvedValueOnce(resposta(['1'], true))
    .mockResolvedValueOnce({ ok: false, status: 503 });
  const { result } = renderHook(() => useBuscaGlobal(dono));
  act(() => result.current.pesquisar('escopo'));
  await act(() => vi.advanceTimersByTimeAsync(250));
  act(() => result.current.mais());
  await act(() => vi.advanceTimersByTimeAsync(250));
  expect(result.current.erro).toContain('Não foi possível');
  fetchMock.mockResolvedValueOnce(resposta(['2'], true));
  act(() => result.current.repetir());
  await act(() => vi.advanceTimersByTimeAsync(250));
  expect(fetchMock.mock.calls[2]?.[0]).toContain('pagina=1');
  expect(result.current.resultado?.mensagens).toHaveLength(2);
  fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
  act(() => result.current.mais());
  await act(() => vi.advanceTimersByTimeAsync(250));
  expect(result.current.resultado).toBeNull();
  expect(result.current.erro).toBe('Entre novamente na mesma conta.');
});
it('timeout termina o loading e limpar cancela a busca', async () => {
  fetchMock.mockImplementation(
    (_url: string, init: RequestInit) =>
      new Promise((_r, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      }),
  );
  const { result } = renderHook(() => useBuscaGlobal(dono));
  act(() => result.current.pesquisar('escopo'));
  await act(() => vi.advanceTimersByTimeAsync(15000));
  expect(result.current.carregando).toBe(false);
  expect(result.current.erro).toContain('Não foi possível');
  act(() => result.current.pesquisar('outra'));
  await act(() => vi.advanceTimersByTimeAsync(250));
  act(() => result.current.pesquisar(''));
  await act(() => vi.advanceTimersByTimeAsync(15000));
  expect(result.current.carregando).toBe(false);
  expect(result.current.erro).toBe('');
  expect(result.current.resultado).toBeNull();
});
