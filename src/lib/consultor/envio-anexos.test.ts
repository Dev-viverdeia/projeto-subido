import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UploadOptions } from 'tus-js-client';

const deps = vi.hoisted(() => ({
  session: vi.fn(),
  rpc: vi.fn(),
  info: vi.fn(),
  remove: vi.fn(),
  uploads: [] as Array<{
    options: UploadOptions;
    start: ReturnType<typeof vi.fn>;
    abort: ReturnType<typeof vi.fn>;
  }>,
}));
vi.mock('@/lib/env', () => ({ env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' } }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getSession: deps.session },
    rpc: deps.rpc,
    storage: { from: () => ({ info: deps.info, remove: deps.remove }) },
  }),
}));
vi.mock('tus-js-client', () => ({
  Upload: class {
    start = vi.fn();
    abort = vi.fn().mockResolvedValue(undefined);
    constructor(
      _: File,
      readonly options: UploadOptions,
    ) {
      deps.uploads.push(this);
    }
  },
}));
import { EnvioAnexos } from './envio-anexos';

const aguardar = () => vi.waitFor(() => expect(deps.uploads.length).toBeGreaterThan(0));
const arquivo = () => new File(['abc'], 'contexto.txt', { type: 'text/plain' });
const concluir = (i: number) => deps.uploads[i]!.options.onSuccess?.({} as never);
const falhar = (i: number) => deps.uploads[i]!.options.onError?.(new Error('network'));

beforeEach(() => {
  vi.clearAllMocks();
  deps.uploads.length = 0;
  deps.session.mockResolvedValue({
    data: { session: { user: { id: 'usuario' }, access_token: 'token' } },
  });
  deps.rpc.mockResolvedValue({ data: 'recibo', error: null });
  deps.info.mockResolvedValue({ data: null });
  deps.remove.mockResolvedValue({ error: null });
});

describe('Envio retomável do Sobral', () => {
  it('publica bytes reais e só confirma a mensagem depois do ACK do arquivo', async () => {
    const progresso = vi.fn();
    const envio = new EnvioAnexos('Leia', [arquivo()], undefined, progresso);
    const resposta = envio.executar();
    await aguardar();
    deps.uploads[0]!.options.onProgress?.(1, 3);
    expect(progresso).toHaveBeenLastCalledWith({
      arquivos: [{ percentual: 33, concluido: false }],
      confirmando: false,
    });
    deps.uploads[0]!.options.onProgress?.(3, 3);
    expect(progresso).toHaveBeenLastCalledWith({
      arquivos: [{ percentual: 99, concluido: false }],
      confirmando: false,
    });
    expect(deps.rpc).not.toHaveBeenCalled();
    concluir(0);
    expect((await resposta).falha).toBeNull();
    expect(deps.rpc).toHaveBeenCalledTimes(1);
    expect(deps.uploads[0]!.options.storeFingerprintForResuming).toBe(false);
  });

  it('retoma a mesma URL e não repete o primeiro arquivo já concluído', async () => {
    const envio = new EnvioAnexos('Leia', [arquivo(), arquivo()], undefined, vi.fn());
    const primeira = envio.executar();
    await aguardar();
    concluir(0);
    await vi.waitFor(() => expect(deps.uploads).toHaveLength(2));
    falhar(1);
    expect((await primeira).falha).toContain('interrompido');
    expect(deps.rpc).not.toHaveBeenCalled();
    const segunda = envio.executar();
    await vi.waitFor(() => expect(deps.uploads[1]!.start).toHaveBeenCalledTimes(2));
    concluir(1);
    expect((await segunda).falha).toBeNull();
    expect(deps.uploads).toHaveLength(2);
    expect(deps.uploads[0]!.start).toHaveBeenCalledTimes(1);
  });

  it('reconhece o arquivo quando a resposta final do Storage se perdeu', async () => {
    const envio = new EnvioAnexos('', [arquivo()], undefined, vi.fn());
    const primeira = envio.executar();
    await aguardar();
    falhar(0);
    await primeira;
    deps.info.mockResolvedValueOnce({ data: { metadata: { size: 3, mimetype: 'text/plain' } } });
    expect((await envio.executar()).falha).toBeNull();
    expect(deps.uploads[0]!.start).toHaveBeenCalledTimes(1);
  });

  it('repete exatamente o mesmo recibo quando a confirmação da mensagem se perde', async () => {
    deps.rpc.mockResolvedValueOnce({ error: { message: 'connection lost' } });
    const envio = new EnvioAnexos('Leia', [arquivo()], 'conversa', vi.fn());
    const primeira = envio.executar();
    await aguardar();
    concluir(0);
    await primeira;
    expect(await envio.cancelar()).toBe(false);
    expect((await envio.executar()).falha).toBeNull();
    expect(deps.rpc.mock.calls[0]).toEqual(deps.rpc.mock.calls[1]);
    expect(deps.uploads).toHaveLength(1);
    expect(deps.remove).not.toHaveBeenCalled();
  });

  it('pausa ao ficar offline sem criar uma mensagem incompleta', async () => {
    const envio = new EnvioAnexos('', [arquivo()], undefined, vi.fn());
    const primeira = envio.executar();
    await aguardar();
    window.dispatchEvent(new Event('offline'));
    expect((await primeira).falha).toContain('interrompido');
    expect(deps.uploads[0]!.abort).toHaveBeenCalledWith(false);
    expect(deps.rpc).not.toHaveBeenCalled();
    expect(await envio.cancelar()).toBe(true);
    await vi.waitFor(() => expect(deps.remove).toHaveBeenCalledTimes(1));
  });

  it('não retoma arquivos se outra conta entrar no navegador', async () => {
    const envio = new EnvioAnexos('', [arquivo()], undefined, vi.fn());
    const primeira = envio.executar();
    await aguardar();
    falhar(0);
    await primeira;
    deps.session.mockResolvedValueOnce({
      data: { session: { user: { id: 'outra' }, access_token: 'outro' } },
    });
    expect((await envio.executar()).falha).toContain('mesma conta');
    expect(deps.uploads[0]!.start).toHaveBeenCalledTimes(1);
  });

  it('não inicia arquivos inválidos nem permite execução concorrente', async () => {
    const invalido = new EnvioAnexos(
      '',
      [new File([], 'vazio.txt', { type: 'text/plain' })],
      undefined,
      vi.fn(),
    );
    expect((await invalido.executar()).falha).toContain('vazio');
    expect(deps.session).not.toHaveBeenCalled();
    const envio = new EnvioAnexos('', [arquivo()], undefined, vi.fn());
    const primeira = envio.executar();
    await aguardar();
    expect((await envio.executar()).falha).toContain('andamento');
    concluir(0);
    await primeira;
  });
});
