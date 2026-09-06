// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), update: vi.fn(), send: vi.fn(), config: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({ resendEnv: mocks.config }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ rpc: mocks.rpc, from: () => ({ update: mocks.update }) }),
}));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));
import { enviarNotificacaoEntrega } from './entrega';

const entrada = {
  eventoId: '77777777-7777-4777-8777-777777777777',
  destinatario: 'delivered@resend.dev',
  conteudo: { assunto: 'Entrega QA', html: '<p>QA</p>', texto: 'QA' },
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.config.mockReturnValue({ chave: 're_teste', remetente: 'Subido <teste@example.com>' });
  mocks.rpc
    .mockResolvedValueOnce({
      data: { resultado: 'reservada', chave: 'chave-estavel', inicio: '2026-09-06T17:00:00Z' },
      error: null,
    })
    .mockResolvedValue({ data: true, error: null });
  const q = {
    eq: vi.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => void) => resolve({ error: null }),
  };
  mocks.update.mockReturnValue(q);
  mocks.send.mockResolvedValue({ data: { id: 'provider-qa' }, error: null });
});

describe('envio seguro da entrega', () => {
  it('usa a reserva durável como chave, com tags para o webhook antecipado', async () => {
    expect((await enviarNotificacaoEntrega(entrada)).status).toBe('enviada');
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: [
          { name: 'contexto', value: 'portal_cliente' },
          { name: 'evento_id', value: entrada.eventoId },
          { name: 'fingerprint', value: expect.stringMatching(/^[a-f0-9]{64}$/) as unknown },
          { name: 'tentativa', value: expect.stringMatching(/^[a-f0-9]{32}$/) as unknown },
        ],
      }),
      { idempotencyKey: 'chave-estavel' },
    );
    expect(mocks.rpc).toHaveBeenLastCalledWith(
      'projeto_email_confirmar',
      expect.objectContaining({ p_status: 'enviado' }),
    );
  });
  it.each(['em_andamento', 'bloqueado', 'obsoleto', 'conteudo_alterado', 'verificacao_necessaria'])(
    'não envia em %s',
    async (resultado) => {
      mocks.rpc.mockReset().mockResolvedValue({ data: { resultado }, error: null });
      expect((await enviarNotificacaoEntrega(entrada)).motivo).toBe(resultado);
      expect(mocks.send).not.toHaveBeenCalled();
    },
  );
  it('não envia se não conseguiu persistir a reserva', async () => {
    mocks.rpc.mockReset().mockResolvedValue({ data: null, error: { code: 'indisponivel' } });
    expect((await enviarNotificacaoEntrega(entrada)).status).toBe('falhou');
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('retorna o destinatário confirmado sem criar uma segunda mensagem', async () => {
    mocks.rpc.mockReset().mockResolvedValue({
      data: { resultado: 'ja_enviada', destinatario: 'original@example.com' },
      error: null,
    });
    expect(await enviarNotificacaoEntrega(entrada)).toEqual({
      status: 'ja_enviada',
      destinatario: 'original@example.com',
    });
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each([409, 429, 500])(
    'trata HTTP %s como incerteza, não rejeição definitiva',
    async (statusCode) => {
      mocks.send.mockResolvedValue({ data: null, error: { statusCode } });
      expect((await enviarNotificacaoEntrega(entrada)).motivo).toBe('envio_incerto');
    },
  );
  it('preserva a chave recuperável em timeout', async () => {
    mocks.send.mockRejectedValue(new Error('timeout'));
    expect((await enviarNotificacaoEntrega(entrada)).motivo).toBe('envio_incerto');
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ email_erro: 'envio_incerto' }),
    );
  });
  it('classifica rejeição explícita e limita o assunto ao tamanho do banco', async () => {
    mocks.send.mockResolvedValue({ data: null, error: { statusCode: 422 } });
    expect(
      (
        await enviarNotificacaoEntrega({
          ...entrada,
          conteudo: { ...entrada.conteudo, assunto: 'a'.repeat(300) },
        })
      ).motivo,
    ).toBe('envio_recusado');
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'a'.repeat(240) }),
      expect.anything(),
    );
  });
});
