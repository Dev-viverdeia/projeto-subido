import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { EDICAO_TESTE as base } from '@/lib/propostas/edicao.fixture';
import { useEdicaoSegura } from './useEdicaoSegura';

const fetchMock = vi.fn();
const aplicar = vi.fn();
const preservar = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const resposta = (valor = base) => ({ ok: true, status: 200, json: () => Promise.resolve(valor) });
const montar = () =>
  renderHook(({ versao }) => useEdicaoSegura(base, versao, aplicar, preservar), {
    initialProps: { versao: 2 },
  });

it('não busca documento sem nova versão; status sozinho atualiza a base sem aplicar conteúdo', async () => {
  fetchMock.mockResolvedValue(resposta({ ...base, versao: 3, status: 'aceita' }));
  const { result, rerender } = montar();
  expect(fetchMock).not.toHaveBeenCalled();
  rerender({ versao: 3 });
  await waitFor(() => expect(result.current.base.versao).toBe(3));
  expect(result.current.bloqueado).toBe(false);
  expect(aplicar).not.toHaveBeenCalled();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it('mantém a base e preserva as duas versões até a escolha explícita', async () => {
  const remota = { ...base, titulo: 'Título salvo em outra aba', versao: 3 };
  fetchMock.mockResolvedValue(resposta(remota));
  const { result, rerender } = montar();
  rerender({ versao: 3 });
  await waitFor(() => expect(result.current.remota).toEqual(remota));
  expect(result.current.base).toEqual(base);
  expect(aplicar).not.toHaveBeenCalled();
  act(() => result.current.abrir());
  act(() => result.current.fechar());
  expect(aplicar).not.toHaveBeenCalled();
  expect(result.current.bloqueado).toBe(true);
  act(() => result.current.usarSalva());
  expect(aplicar).toHaveBeenCalledWith(remota);
  expect(result.current.base.versao).toBe(3);
});
it('não troca silenciosamente a comparação enquanto o modal está aberto', async () => {
  fetchMock.mockResolvedValue(resposta({ ...base, titulo: 'Título novo', versao: 3 }));
  const { result, rerender } = montar();
  rerender({ versao: 3 });
  await waitFor(() => expect(result.current.remota?.versao).toBe(3));
  act(() => result.current.abrir());
  rerender({ versao: 4 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(result.current.remota?.versao).toBe(3);
  act(() =>
    result.current.concluir({ conflito: { ...base, titulo: 'Mudou outra vez', versao: 4 } }),
  );
  expect(result.current.mudouNovamente).toBe(true);
  expect(result.current.remota?.versao).toBe(4);
});
it('leitura atrasada não restaura a base anterior a um salvamento', async () => {
  let liberar!: (r: ReturnType<typeof resposta>) => void;
  fetchMock.mockReturnValue(
    new Promise((resolve) => {
      liberar = resolve;
    }),
  );
  const { result, rerender } = montar();
  rerender({ versao: 3 });
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const salva = { ...base, titulo: 'Minha edição salva', versao: 4 };
  act(() => result.current.iniciar());
  act(() => result.current.concluir({ sucesso: 'Salva', versao: 4, edicao: salva }));
  await act(async () => {
    liberar(resposta({ ...base, titulo: 'Leitura antiga', versao: 3 }));
    await Promise.resolve();
  });
  expect(result.current.base).toEqual(salva);
  expect(result.current.remota).toBeNull();
});
it('falha permite tentar novamente sem desbloquear uma base desatualizada', async () => {
  fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
  const { result, rerender } = montar();
  rerender({ versao: 3 });
  await waitFor(() => expect(result.current.erro).toContain('Tente novamente'));
  expect(result.current.bloqueado).toBe(true);
  expect(aplicar).not.toHaveBeenCalled();
  fetchMock.mockResolvedValue(resposta({ ...base, versao: 3 }));
  act(() => result.current.tentar());
  await waitFor(() => expect(result.current.base.versao).toBe(3));
  expect(result.current.erro).toBeNull();
});
it('ID diferente ou leitura antiga nunca é aplicada', async () => {
  fetchMock.mockResolvedValue(
    resposta({ ...base, id: '22222222-2222-4222-8222-222222222222', versao: 3 }),
  );
  const { result, rerender } = montar();
  rerender({ versao: 3 });
  await waitFor(() => expect(result.current.erro).not.toBeNull());
  expect(result.current.base).toEqual(base);
  expect(aplicar).not.toHaveBeenCalled();
});
