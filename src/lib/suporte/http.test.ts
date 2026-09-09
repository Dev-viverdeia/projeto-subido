// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { corpoLimitado, jsonLimitado } from './http';
describe('limites reais de leitura do suporte', () => {
  it('lê um pedido válido', async () => {
    expect(
      await jsonLimitado(
        new Request('https://subido.test', { method: 'POST', body: '{"ok":true}' }),
      ),
    ).toEqual({ ok: true });
  });
  it('rejeita o corpo grande mesmo sem content-length', async () => {
    await expect(
      corpoLimitado(
        new Request('https://subido.test', { method: 'POST', body: 'x'.repeat(100) }),
        20,
      ),
    ).rejects.toThrow('corpo_grande');
  });
  it('rejeita tamanho declarado antes de processar', async () => {
    await expect(
      corpoLimitado(
        new Request('https://subido.test', {
          method: 'POST',
          body: 'x',
          headers: { 'content-length': '100' },
        }),
        20,
      ),
    ).rejects.toThrow('corpo_grande');
  });
});
