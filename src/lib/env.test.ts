import { afterEach, describe, expect, it, vi } from 'vitest';
import { resendEnv } from './env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resendEnv', () => {
  it('aceita o segredo Base64 completo emitido pelo Resend', () => {
    vi.stubEnv('RESEND_API_KEY', 're_chave_de_teste');
    vi.stubEnv('RESEND_FROM_EMAIL', 'Subido <notificacoes@subido.viverdeia.ai>');
    vi.stubEnv('RESEND_WEBHOOK_SECRET', 'whsec_abc/DEF+ghi=');

    expect(resendEnv()?.webhook).toBe('whsec_abc/DEF+ghi=');
  });
});
