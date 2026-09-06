// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), verify: vi.fn(), config: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({ resendEnv: mocks.config }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ rpc: mocks.rpc }) }));
vi.mock('resend', () => ({
  Resend: class {
    webhooks = { verify: mocks.verify };
  },
}));
import { POST } from './route';

const evento = {
  type: 'email.delivered',
  created_at: '2026-09-06T15:00:00Z',
  data: {
    email_id: 'provider-qa',
    tags: {
      evento_id: '77777777-7777-4777-8777-777777777777',
      fingerprint: 'a'.repeat(64),
      tentativa: 'b'.repeat(32),
    },
  },
};
const request = (headers = true) =>
  new Request('https://subido.example/api/resend/webhook', {
    method: 'POST',
    body: JSON.stringify(evento),
    headers: headers
      ? {
          'svix-id': 'evt-qa',
          'svix-timestamp': '100',
          'svix-signature': 'signature-qa',
        }
      : {},
  });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.config.mockReturnValue({ chave: 're_qa', webhook: 'whsec_qa' });
  mocks.verify.mockReturnValue(evento);
  mocks.rpc.mockResolvedValue({ data: true, error: null });
});
describe('confirmação de e-mail', () => {
  it('verifica o corpo bruto antes de gravar e correlaciona um webhook antecipado', async () => {
    expect((await POST(request())).status).toBe(200);
    expect(mocks.verify).toHaveBeenCalledWith(
      expect.objectContaining({ payload: JSON.stringify(evento) }),
    );
    expect(mocks.rpc).toHaveBeenCalledWith(
      'projeto_email_confirmar',
      expect.objectContaining({
        p_evento: evento.data.tags.evento_id,
        p_fingerprint: evento.data.tags.fingerprint,
        p_status: 'entregue',
        p_tentativa: 'b'.repeat(32),
      }),
    );
  });
  it('rejeita ausência de assinatura sem acessar o banco', async () => {
    expect((await POST(request(false))).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('rejeita assinatura inválida', async () => {
    mocks.verify.mockImplementation(() => {
      throw new Error('invalid');
    });
    expect((await POST(request())).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('pede nova tentativa ao provedor se a persistência falhar', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'offline' } });
    expect((await POST(request())).status).toBe(500);
  });
  it('mantém compatibilidade com envios anteriores, identificados pelo provedor', async () => {
    mocks.verify.mockReturnValue({ ...evento, data: { email_id: 'legacy' } });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith(
      'projeto_email_confirmar',
      expect.objectContaining({ p_evento: null, p_fingerprint: null }),
    );
  });
  it('não transforma abertura em prova de entrega', async () => {
    mocks.verify.mockReturnValue({ ...evento, type: 'email.opened' });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
