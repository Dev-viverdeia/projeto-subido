// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({
  env: { NEXT_PUBLIC_SUPABASE_URL: 'https://banco.example.test' },
  serverEnv: () => ({ SUPABASE_SECRET_KEY: 'teste-local-sem-acesso' }),
}));
import { createAdminClient } from './admin';
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('o deadline do worker cancela consultas reais do SDK sem alterar o fetch global', async () => {
  const ciclo = new AbortController();
  let transporte!: AbortSignal;
  const fetch = vi.fn(
    (_url: unknown, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        transporte = init.signal!;
        if (transporte.aborted) {
          reject(new Error('transporte já cancelado'));
          return;
        }
        transporte.addEventListener('abort', () => reject(new Error('transporte cancelado')), {
          once: true,
        });
      }),
  );
  vi.stubGlobal('fetch', fetch);
  const timeout = vi.spyOn(AbortSignal, 'timeout');
  const db = createAdminClient({ signal: ciclo.signal, timeoutMs: 10_000 });
  const trabalho = Promise.resolve(db.from('suporte_notificacoes').select('id'));
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  ciclo.abort(new Error('tempo esgotado'));
  expect((await trabalho).error).toBeTruthy();
  expect(transporte.aborted).toBe(true);
  expect(timeout).toHaveBeenCalledWith(10_000);
  expect(globalThis.fetch).toBe(fetch);
  expect(fetch).toHaveBeenCalledOnce();
});
