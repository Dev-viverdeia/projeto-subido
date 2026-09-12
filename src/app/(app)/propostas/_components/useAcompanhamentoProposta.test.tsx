import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { AcompanhamentoProposta } from '@/lib/propostas/acompanhamento';
import { useAcompanhamentoProposta } from './useAcompanhamentoProposta';

const BASE: AcompanhamentoProposta = {
  id: '11111111-1111-4111-8111-111111111111',
  status: 'apresentada',
  versao: 2,
  execucaoId: null,
  compartilhamento: {
    codigo: '44444444-4444-4444-8444-444444444444',
    ativo: true,
    compartilhadaEm: '2026-09-12T12:00:00Z',
    primeiraVisualizacaoEm: null,
    ultimaVisualizacaoEm: null,
    visualizacoes: 0,
    decisaoNome: null,
    decisaoEmail: null,
    decisaoComentario: null,
    decididaEm: null,
  },
};
const buscar = vi.fn<typeof fetch>();
const resposta = (dados = BASE) => Response.json(dados);
const avancar = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
const esperarMudanca = async (acao: () => void) => {
  await act(async () => {
    acao();
    await Promise.resolve();
  });
};
let online = true;
let visivel: DocumentVisibilityState = 'visible';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-12T12:00:00Z'));
  online = true;
  visivel = 'visible';
  vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visivel);
  buscar.mockReset().mockImplementation(() => Promise.resolve(resposta()));
  vi.stubGlobal('fetch', buscar);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('atualiza apenas os metadados a cada 30 segundos, sem consulta duplicada na abertura', async () => {
  buscar.mockImplementation(() =>
    Promise.resolve(
      resposta({ ...BASE, compartilhamento: { ...BASE.compartilhamento, visualizacoes: 2 } }),
    ),
  );
  const { result } = renderHook(() => useAcompanhamentoProposta(BASE));
  expect(buscar).not.toHaveBeenCalled();
  await avancar(30_000);
  expect(result.current.dados.compartilhamento.visualizacoes).toBe(2);
  expect(result.current.aviso).toBeNull();
  expect(buscar).toHaveBeenCalledWith(
    `/api/propostas/${BASE.id}/acompanhamento`,
    expect.objectContaining({ cache: 'no-store', credentials: 'same-origin' }),
  );
  await avancar(30_000);
  expect(buscar).toHaveBeenCalledTimes(2);
  expect(result.current.falha).toBeNull();
});

it('reconhece aceite e entrega sem acionar mutações ou navegação', async () => {
  const aceita = {
    ...BASE,
    status: 'aceita' as const,
    versao: 3,
    execucaoId: '55555555-5555-4555-8555-555555555555',
    compartilhamento: {
      ...BASE.compartilhamento,
      decisaoNome: 'Camila',
      decididaEm: '2026-09-12T12:00:00Z',
    },
  };
  buscar.mockImplementation(() => Promise.resolve(resposta(aceita)));
  const { result } = renderHook(() => useAcompanhamentoProposta(BASE));
  await avancar(30_000);
  expect(result.current.dados).toEqual(aceita);
  expect(result.current.aviso).toBe('A proposta foi aceita.');
  act(() => result.current.dispensarAviso());
  await avancar(30_000);
  expect(result.current.aviso).toBeNull();
  expect(result.current.falha).toBeNull();
});

it('retoma uma conexão breve em até cinco segundos, sem acumular consultas por foco', async () => {
  const { result } = renderHook(() => useAcompanhamentoProposta(BASE));
  await avancar(30_000);
  act(() => {
    online = false;
    window.dispatchEvent(new Event('offline'));
    online = true;
    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('focus'));
  });
  await avancar(5_000);
  expect(buscar).toHaveBeenCalledTimes(2);
  expect(result.current.falha).toBeNull();
});

it('pausa em aba oculta e sem internet, retomando sem duplicar consultas ao voltar', async () => {
  const { result } = renderHook(() => useAcompanhamentoProposta(BASE));
  act(() => {
    visivel = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await avancar(120_000);
  expect(buscar).not.toHaveBeenCalled();
  await esperarMudanca(() => {
    visivel = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
  });
  expect(buscar).toHaveBeenCalledTimes(1);
  act(() => {
    online = false;
    window.dispatchEvent(new Event('offline'));
  });
  expect(result.current.falha).toBe('offline');
  await avancar(120_000);
  expect(buscar).toHaveBeenCalledTimes(1);
  await esperarMudanca(() => {
    online = true;
    window.dispatchEvent(new Event('online'));
  });
  expect(buscar).toHaveBeenCalledTimes(2);
  expect(result.current.falha).toBeNull();
});

it('mantém a última informação e reduz tentativas depois de falha temporária', async () => {
  buscar.mockRejectedValueOnce(new Error('network'));
  const { result } = renderHook(() => useAcompanhamentoProposta(BASE));
  await avancar(30_000);
  expect(result.current.falha).toBe('temporaria');
  expect(result.current.dados).toEqual(BASE);
  await avancar(30_000);
  expect(buscar).toHaveBeenCalledTimes(1);
  await avancar(30_000);
  expect(buscar).toHaveBeenCalledTimes(2);
  expect(result.current.falha).toBeNull();
});

it('interrompe uma conexão travada por timeout, sem sobrepor requisições', async () => {
  buscar.mockImplementationOnce(
    (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Abortado', 'AbortError')),
        );
      }),
  );
  const { result } = renderHook(() => useAcompanhamentoProposta(BASE));
  await avancar(30_000);
  await esperarMudanca(() => result.current.tentarNovamente());
  expect(buscar).toHaveBeenCalledTimes(1);
  await avancar(12_000);
  expect(result.current.consultando).toBe(false);
  expect(result.current.falha).toBe('temporaria');
  await avancar(60_000);
  expect(result.current.falha).toBeNull();
});

it.each([401, 403, 404])(
  'para ao perder acesso (%s), mas permite conferir após entrar novamente',
  async (status) => {
    buscar.mockResolvedValueOnce(new Response(null, { status }));
    const { result } = renderHook(() => useAcompanhamentoProposta(BASE));
    await avancar(30_000);
    expect(result.current.falha).toBe(status === 401 ? 'sessao' : 'acesso');
    await avancar(300_000);
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(buscar).toHaveBeenCalledTimes(1);
    await esperarMudanca(() => result.current.tentarNovamente());
    expect(result.current.falha).toBeNull();
  },
);

it('ignora uma leitura tardia anterior ao salvamento, mesmo se o transporte não respeitar o cancelamento', async () => {
  let concluir!: (resposta: Response) => void;
  buscar.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        concluir = resolve;
      }),
  );
  const { result } = renderHook(() => useAcompanhamentoProposta(BASE));
  await avancar(30_000);
  act(() => result.current.iniciarAlteracao());
  await avancar(90_000);
  expect(buscar).toHaveBeenCalledTimes(1);
  buscar.mockResolvedValueOnce(resposta({ ...BASE, status: 'rascunho', versao: 4 }));
  await esperarMudanca(() =>
    result.current.concluirAlteracao({ sucesso: 'Salva', status: 'rascunho', versao: 4 }),
  );
  await esperarMudanca(() => {
    concluir(resposta({ ...BASE, status: 'aceita', versao: 3 }));
  });
  expect(result.current.dados.status).toBe('rascunho');
  expect(result.current.dados.versao).toBe(4);
});

it('a confirmação de link é imediata e não regride para estado de ação antigo', async () => {
  const codigo = '55555555-5555-4555-8555-555555555555';
  const { result } = renderHook(() => useAcompanhamentoProposta(BASE));
  act(() => result.current.iniciarAlteracao());
  buscar.mockRejectedValueOnce(new Error('network'));
  await esperarMudanca(() =>
    result.current.concluirAlteracao({ sucesso: 'Novo link', codigo, ativo: true }),
  );
  expect(result.current.dados.compartilhamento.codigo).toBe(codigo);
  buscar.mockResolvedValueOnce(
    resposta({ ...BASE, compartilhamento: { ...BASE.compartilhamento, codigo, ativo: false } }),
  );
  await esperarMudanca(() => result.current.tentarNovamente());
  expect(result.current.dados.compartilhamento.ativo).toBe(false);
});

it('ignora resposta de outra proposta e para de consultar depois de sair da tela', async () => {
  buscar.mockResolvedValueOnce(resposta({ ...BASE, id: '55555555-5555-4555-8555-555555555555' }));
  const { result, unmount } = renderHook(() => useAcompanhamentoProposta(BASE));
  await avancar(30_000);
  expect(result.current.dados).toEqual(BASE);
  expect(result.current.falha).toBe('temporaria');
  unmount();
  await avancar(300_000);
  window.dispatchEvent(new Event('focus'));
  expect(buscar).toHaveBeenCalledTimes(1);
});
