import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { EDICAO_TESTE as base } from '@/lib/propostas/edicao.fixture';
import { limparRascunhosProposta, listarRascunhosProposta } from '@/lib/propostas/rascunho-local';
import { useRascunhoProposta } from './useRascunhoProposta';

const dono = '77777777-7777-4777-8777-777777777777';
const local = { titulo: 'Meu texto não salvo', documento: base.documento, valor: '1000,' };
const montar = () =>
  renderHook(({ sujo, titulo }) => useRascunhoProposta(dono, base, { ...local, titulo }, sujo), {
    initialProps: { sujo: true, titulo: local.titulo },
  });
const guardar = () => {
  act(() => {
    vi.advanceTimersByTime(350);
  });
};
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('recupera após desmontar, sem substituir campos automaticamente', () => {
  const a = montar();
  guardar();
  expect(a.result.current.disponiveis).toHaveLength(0);
  a.unmount();
  const b = renderHook(() => useRascunhoProposta(dono, base, { ...base, valor: '1000' }, false));
  expect(b.result.current.disponiveis[0]?.titulo).toBe(local.titulo);
  expect(listarRascunhosProposta(dono)).toHaveLength(1);
});
it('pagehide guarda inclusive a última tecla antes do debounce', () => {
  const a = montar();
  a.rerender({ sujo: true, titulo: 'Última tecla' });
  act(() => {
    window.dispatchEvent(new Event('pagehide'));
  });
  expect(listarRascunhosProposta(dono)[0]?.titulo).toBe('Última tecla');
});
it('confirmação parcial não apaga digitação posterior; salvo limpo remove somente sua cópia', () => {
  const a = montar();
  const b = montar();
  guardar();
  a.rerender({ sujo: true, titulo: 'Digitei depois do envio' });
  guardar();
  expect(listarRascunhosProposta(dono).map((r) => r.titulo)).toContain('Digitei depois do envio');
  a.rerender({ sujo: false, titulo: 'Digitei depois do envio' });
  guardar();
  expect(listarRascunhosProposta(dono)).toHaveLength(1);
  expect(b.result.current.falhou).toBe(false);
});
it('retomar cria chave própria e não perde a cópia se storage falhar', () => {
  const a = montar();
  guardar();
  a.unmount();
  const b = renderHook(() => useRascunhoProposta(dono, base, { ...base, valor: '1000' }, false));
  const r = b.result.current.disponiveis[0]!;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  act(() => expect(b.result.current.retomar(r)).toBe(true));
  expect(listarRascunhosProposta(dono)).toHaveLength(1);
});

it('não substitui os campos atuais por outra cópia se não puder guardar a última tecla', () => {
  const a = montar();
  guardar();
  const r = listarRascunhosProposta(dono)[0]!;
  a.rerender({ sujo: true, titulo: 'Última mudança ainda no debounce' });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  act(() => expect(a.result.current.retomar(r)).toBe(false));
  expect(a.result.current.falhou).toBe(true);
});
it('logout bloqueia gravação atrasada, retomada e cleanup', () => {
  const a = montar();
  guardar();
  const r = listarRascunhosProposta(dono)[0]!;
  act(() => limparRascunhosProposta());
  expect(a.result.current.bloqueado).toBe(true);
  act(() => expect(a.result.current.retomar(r)).toBe(false));
  a.rerender({ sujo: true, titulo: 'Não recriar' });
  guardar();
  a.unmount();
  expect(listarRascunhosProposta(dono)).toEqual([]);
});
it('sem storage alerta e pede proteção nativa somente se há edição não guardada', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  const a = montar();
  guardar();
  expect(a.result.current.falhou).toBe(true);
  const sair = new Event('beforeunload', { cancelable: true });
  act(() => {
    window.dispatchEvent(sair);
  });
  expect(sair.defaultPrevented).toBe(true);
  a.rerender({ sujo: false, titulo: local.titulo });
  const limpo = new Event('beforeunload', { cancelable: true });
  act(() => {
    window.dispatchEvent(limpo);
  });
  expect(limpo.defaultPrevented).toBe(false);
});
