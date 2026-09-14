import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { reduzirRetomada, useRetomadaReuniao } from './useRetomadaReuniao';

const credenciais = { token: 'teste', serverUrl: 'wss://example.test' };
const inicial = { credenciais: null, fase: 'fora', tentativa: 0, geracao: 0 } as const;
const conectar = () => reduzirRetomada(inicial, { tipo: 'entrar', credenciais });
const rede = (online: boolean) => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: online });
  window.dispatchEvent(new Event(online ? 'online' : 'offline'));
};

afterEach(() => {
  vi.useRealTimers();
  rede(true);
});

describe('retomada da reunião', () => {
  it('limita tentativas mesmo quando as credenciais chegam mas o provedor não conecta', () => {
    let estado = conectar();
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      estado = reduzirRetomada(estado, { tipo: 'queda', geracao: estado.geracao });
      expect(estado).toMatchObject({ fase: 'recuperando', tentativa });
      estado = reduzirRetomada(estado, {
        tipo: 'credenciais',
        geracao: estado.geracao,
        credenciais,
      });
      expect(estado.tentativa).toBe(tentativa);
    }
    estado = reduzirRetomada(estado, { tipo: 'queda', geracao: estado.geracao });
    expect(estado.fase).toBe('falhou');
    expect(reduzirRetomada(estado, { tipo: 'tentar' })).toMatchObject({
      fase: 'recuperando',
      tentativa: 1,
    });
  });
  it('reinicia o limite somente após confirmação de conexão', () => {
    let estado = reduzirRetomada(conectar(), { tipo: 'queda', geracao: 1 });
    estado = reduzirRetomada(estado, { tipo: 'credenciais', geracao: estado.geracao, credenciais });
    estado = reduzirRetomada(estado, { tipo: 'conectou', geracao: estado.geracao });
    expect(estado).toMatchObject({ fase: 'conectada', tentativa: 0 });
    expect(reduzirRetomada(estado, { tipo: 'queda', geracao: estado.geracao }).tentativa).toBe(1);
  });
  it('ignora eventos duplicados e respostas de uma participação anterior', () => {
    const estado = conectar();
    const queda = reduzirRetomada(estado, { tipo: 'queda', geracao: estado.geracao });
    expect(reduzirRetomada(queda, { tipo: 'queda', geracao: estado.geracao })).toBe(queda);
    const saiu = reduzirRetomada(queda, { tipo: 'sair' });
    expect(
      reduzirRetomada(saiu, { tipo: 'credenciais', geracao: queda.geracao, credenciais }),
    ).toBe(saiu);
    expect(reduzirRetomada(saiu, { tipo: 'conectou', geracao: queda.geracao })).toBe(saiu);
  });
  it('pausa sem internet e retoma a mesma tentativa quando a rede volta', async () => {
    vi.useFakeTimers();
    const obter = vi.fn().mockResolvedValue(credenciais);
    const { result } = renderHook(() => useRetomadaReuniao(obter));
    act(() => {
      result.current.dispatch({ tipo: 'entrar', credenciais });
      rede(false);
    });
    act(() => result.current.dispatch({ tipo: 'queda', geracao: result.current.estado.geracao }));
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(obter).not.toHaveBeenCalled();
    expect(result.current.estado.tentativa).toBe(1);
    act(() => rede(true));
    await act(() => vi.advanceTimersByTimeAsync(700));
    expect(obter).toHaveBeenCalledTimes(1);
    expect(result.current.estado).toMatchObject({ fase: 'conectando', tentativa: 1 });
  });
  it('aborta pedido antigo ao ficar offline e ignora a resposta tardia', async () => {
    vi.useFakeTimers();
    let resolver!: (valor: typeof credenciais) => void;
    const obter = vi.fn(
      () =>
        new Promise<typeof credenciais>((resolve) => {
          resolver = resolve;
        }),
    );
    const { result } = renderHook(() => useRetomadaReuniao(obter));
    act(() => result.current.dispatch({ tipo: 'entrar', credenciais }));
    act(() => result.current.dispatch({ tipo: 'queda', geracao: result.current.estado.geracao }));
    await act(() => vi.advanceTimersByTimeAsync(700));
    const sinal = (obter.mock.calls[0] as unknown as [AbortSignal])[0];
    act(() => rede(false));
    expect(sinal.aborted).toBe(true);
    await act(async () => {
      resolver(credenciais);
      await Promise.resolve();
    });
    expect(result.current.estado.fase).toBe('recuperando');
    expect(result.current.estado.credenciais).toBeNull();
  });
  it('não fica presa em credenciais sem resposta e esgota três tentativas', async () => {
    vi.useFakeTimers();
    const obter = vi.fn(() => new Promise<typeof credenciais>(() => {}));
    const { result } = renderHook(() => useRetomadaReuniao(obter));
    act(() => result.current.dispatch({ tipo: 'entrar', credenciais }));
    act(() => result.current.dispatch({ tipo: 'queda', geracao: result.current.estado.geracao }));
    for (const atraso of [700, 1400, 2100]) {
      await act(() => vi.advanceTimersByTimeAsync(atraso));
      await act(() => vi.advanceTimersByTimeAsync(15_000));
    }
    expect(obter).toHaveBeenCalledTimes(3);
    expect(result.current.estado.fase).toBe('falhou');
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(obter).toHaveBeenCalledTimes(3);
  });
  it('pausa a recuperação enquanto a pessoa escolhe sair e limpa timers na saída', async () => {
    vi.useFakeTimers();
    const obter = vi.fn().mockResolvedValue(credenciais);
    const { result, rerender } = renderHook(({ pausa }) => useRetomadaReuniao(obter, pausa), {
      initialProps: { pausa: true },
    });
    act(() => result.current.dispatch({ tipo: 'entrar', credenciais }));
    act(() => result.current.dispatch({ tipo: 'queda', geracao: result.current.estado.geracao }));
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(obter).not.toHaveBeenCalled();
    rerender({ pausa: false });
    act(() => result.current.dispatch({ tipo: 'sair' }));
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(obter).not.toHaveBeenCalled();
  });
});
