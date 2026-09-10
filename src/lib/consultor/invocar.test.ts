// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pararResposta, responderPendente, type OpcoesResposta } from './invocar';
import type { EventoSobral, GeracaoSobral } from './geracao-contrato';
const base: GeracaoSobral = {
  mensagem_id: '2ec0ea68-0b60-4d59-8d53-2a29c4de2083',
  thread_id: '11cd8319-e8af-4723-8755-6f5781bc8e14',
  tentativa: '4e5d9c51-489e-436f-8fc6-223d15ed15f7',
  estado: 'gerando',
  texto: '',
  erro: null,
  parar_em: null,
  resposta_id: null,
  expira_em: new Date(Date.now() + 240000).toISOString(),
};
const opcoes = (): OpcoesResposta => ({
  mensagemId: base.mensagem_id,
  tentativa: base.tentativa,
  signal: new AbortController().signal,
  aoEvento: vi.fn(),
  aoConferir: vi.fn(),
});
const completo = { ...base, estado: 'concluida', texto: 'Pergunte sobre o atendimento atual.' };
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('recuperação da resposta', () => {
  it('409 confere o resultado em vez de autorizar uma nova geração', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ erro: 'Confira a resposta existente.' }, { status: 409 }),
      )
      .mockResolvedValueOnce(Response.json({ geracao: completo }));
    vi.stubGlobal('fetch', fetch);
    const opts = opcoes();
    expect((await responderPendente(base.thread_id, opts)).dados?.resposta).toBe(completo.texto);
    expect(opts.aoConferir).toHaveBeenCalledOnce();
    expect(fetch.mock.calls.map((c) => (c[1] as RequestInit).method ?? 'GET')).toEqual([
      'POST',
      'GET',
    ]);
  });
  it('sessão expirada durante recuperação pede login sem novo POST', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ erro: 'Login' }, { status: 401 }));
    vi.stubGlobal('fetch', fetch);
    expect(
      (await responderPendente(base.thread_id, { ...opcoes(), somenteConferir: true })).falha?.tipo,
    ).toBe('sessao');
    expect(fetch.mock.calls.every((c) => !(c[1] as RequestInit).method)).toBe(true);
  });
  it('limite de concorrência preserva a pergunta e não repete POST automaticamente', async () => {
    const mensagem =
      'Você já tem respostas em andamento. Aguarde uma terminar; sua pergunta está salva.';
    const fetch = vi.fn().mockResolvedValue(Response.json({ erro: mensagem }, { status: 429 }));
    vi.stubGlobal('fetch', fetch);
    expect((await responderPendente(base.thread_id, opcoes())).falha?.mensagem).toBe(mensagem);
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('entrega texto antes da confirmação final', async () => {
    let stream!: ReadableStreamDefaultController<Uint8Array>;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          new ReadableStream<Uint8Array>({
            start(c) {
              stream = c;
            },
          }),
          { headers: { 'Content-Type': 'application/x-ndjson' } },
        ),
      ),
    );
    const opts = opcoes();
    const tarefa = responderPendente(base.thread_id, opts);
    const emitir = (evento: unknown) =>
      stream.enqueue(new TextEncoder().encode(`${JSON.stringify(evento)}\n`));
    emitir({ tipo: 'estado', geracao: base });
    emitir({ tipo: 'texto', texto: 'Pergunte sobre' });
    await vi.waitFor(() =>
      expect(opts.aoEvento).toHaveBeenCalledWith({ tipo: 'texto', texto: 'Pergunte sobre' }),
    );
    emitir({ tipo: 'estado', geracao: completo });
    stream.close();
    expect((await tarefa).dados?.resposta).toBe(completo.texto);
  });
  it('ACK perdido consulta a pergunta, sem repetir POST', async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('rede'))
      .mockResolvedValueOnce(Response.json({ geracao: completo }));
    vi.stubGlobal('fetch', fetch);
    expect((await responderPendente(base.thread_id, opcoes())).dados?.resposta).toBe(
      completo.texto,
    );
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls.map((c) => (c[1] as RequestInit).method ?? 'GET')).toEqual([
      'POST',
      'GET',
    ]);
  });
  it('202 retoma o recibo sem uma segunda geração', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ geracao: base }, { status: 202 }))
      .mockResolvedValueOnce(Response.json({ geracao: completo }));
    vi.stubGlobal('fetch', fetch);
    expect((await responderPendente(base.thread_id, opcoes())).falha).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('interrupção preserva parcial e exige nova intenção explícita', async () => {
    const estado = {
      ...base,
      estado: 'interrompida',
      texto: 'Comece pela',
      erro: 'Resposta interrompida.',
    };
    const fetch = vi.fn().mockResolvedValue(Response.json({ geracao: estado }));
    vi.stubGlobal('fetch', fetch);
    const opts = opcoes();
    const retorno = await responderPendente(base.thread_id, opts);
    expect(retorno.falha?.tipo).toBe('interrompida');
    expect(opts.aoEvento).toHaveBeenCalledWith({ tipo: 'estado', geracao: estado });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('consulta explícita nunca envia POST e rejeita recibo de outra pergunta', async () => {
    vi.useFakeTimers();
    const fetch = vi
      .fn()
      .mockImplementation(() =>
        Response.json({ geracao: { ...completo, mensagem_id: crypto.randomUUID() } }),
      );
    vi.stubGlobal('fetch', fetch);
    const retorno = responderPendente(base.thread_id, { ...opcoes(), somenteConferir: true });
    await vi.runAllTimersAsync();
    expect((await retorno).falha?.tipo).toBe('pendente');
    expect(fetch.mock.calls.every((c) => !(c[1] as RequestInit).method)).toBe(true);
  });
  it('parar envia a tentativa exata e não finge conclusão', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        Response.json({ geracao: { ...base, parar_em: new Date().toISOString() } }),
      );
    vi.stubGlobal('fetch', fetch);
    expect((await pararResposta(base)).estado).toBe('gerando');
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ mensagem_id: base.mensagem_id, tentativa: base.tentativa }),
      }),
    );
  });
  it('não insiste após recusa de autorização', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(Response.json({ erro: 'Faça login.' }, { status: 401 }));
    vi.stubGlobal('fetch', fetch);
    const eventos: EventoSobral[] = [];
    expect(
      (await responderPendente(base.thread_id, { ...opcoes(), aoEvento: (e) => eventos.push(e) }))
        .falha?.mensagem,
    ).toBe('Faça login.');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(eventos).toHaveLength(0);
  });
});
