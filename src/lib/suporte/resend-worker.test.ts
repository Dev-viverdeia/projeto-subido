// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { ResendSuporte } from './resend-worker';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe('prazo real no transporte do e-mail', () => {
  it('cancela requisição pendurada quando o ciclo termina, sem segundo envio', async () => {
    const ciclo = new AbortController();
    let signal!: AbortSignal;
    const fetch = vi.fn(
      (_url: unknown, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          signal = init.signal!;
          signal.addEventListener('abort', () => reject(new Error('transporte cancelado')), {
            once: true,
          });
        }),
    );
    vi.stubGlobal('fetch', fetch);
    const prazo = vi.spyOn(AbortSignal, 'timeout');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const resultado = new ResendSuporte('chave-teste', ciclo.signal).emails.send(
      { from: 'qa@example.test', to: 'qa@example.test', subject: 'Teste', text: 'Somente local' },
      { idempotencyKey: 'suporte/teste-local' },
    );
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    ciclo.abort(new Error('prazo')); // Abort cancela o transporte, não abandona uma Promise.
    expect((await resultado).error).toBeTruthy();
    expect(signal.aborted).toBe(true);
    expect(prazo).toHaveBeenCalledWith(12_000);
    expect(fetch).toHaveBeenCalledOnce();
    expect(new Headers(fetch.mock.calls[0]![1].headers).get('Idempotency-Key')).toBe(
      'suporte/teste-local',
    );
  });
  it('429 não cria rajada de retries dentro da mesma requisição', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        Response.json({ name: 'rate_limit_exceeded', message: 'Aguarde' }, { status: 429 }),
      );
    vi.stubGlobal('fetch', fetch);
    const resultado = await new ResendSuporte('chave-teste').emails.receiving.get('email-teste');
    expect(resultado.error?.name).toBe('rate_limit_exceeded');
    expect(fetch).toHaveBeenCalledOnce();
  });
});
