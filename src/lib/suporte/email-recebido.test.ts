// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  get: vi.fn(),
  limitar: vi.fn(),
  cliente: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn() }));
vi.mock('@/lib/env', () => ({
  env: { NEXT_PUBLIC_SITE_URL: 'https://subido.example' },
  suporteEmailEnv: () => ({ api: 'teste', dominio: 'suporte.example', chave: 'x'.repeat(48) }),
}));
vi.mock('./servidor', () => ({
  criarSistemaSuporte: mocks.cliente,
  limitarSuporte: mocks.limitar,
  hashAcesso: () => 'hash-teste',
}));
vi.mock('./email-autenticidade', () => ({ remetenteAutentico: () => Promise.resolve(true) }));
vi.mock('./resend-worker', () => ({
  ResendSuporte: class {
    emails = { receiving: { get: mocks.get } };
  },
}));
import { processarEmailsSuporte } from './email-recebido';
const id = 'f1487f63-eea7-44c9-bca6-148d3e77c304';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.cliente.mockReturnValue(mocks);
  mocks.rpc
    .mockResolvedValue({ data: null, error: null })
    .mockResolvedValueOnce({ data: [{ id }], error: null });
  mocks.limitar.mockResolvedValue(true);
  mocks.get.mockResolvedValue({
    error: null,
    data: {
      from: 'qa@example.test',
      to: ['ajuda@suporte.example'],
      received_for: ['ajuda@suporte.example'],
      headers: {},
      raw: { download_url: 'https://provedor.example/raw' },
      attachments: [],
      text: 'Preciso de ajuda com minha conta.',
      subject: 'Ajuda com a conta',
      message_id: '<mensagem@example.test>',
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => new Response('Mensagem original sintética')),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
});
describe('ciclo de recebimento com prazo', () => {
  it('leva o cancelamento também às verificações de limite, não só aos downloads', async () => {
    const signal = new AbortController().signal;
    expect(await processarEmailsSuporte(signal)).toEqual({
      incorporados: 1,
      revisao: 0,
      falhasRecebimento: 0,
    });
    expect(mocks.cliente).toHaveBeenCalledWith({ signal });
    expect(mocks.limitar).toHaveBeenCalledTimes(2);
    for (const chamada of mocks.limitar.mock.calls) expect(chamada[4]).toBe(signal);
    expect(mocks.rpc).toHaveBeenCalledWith(
      'suporte_email_novo',
      expect.objectContaining({ p_email: id }),
    );
  });
  it('não reserva pedidos quando o ciclo já expirou', async () => {
    await expect(processarEmailsSuporte(AbortSignal.abort())).rejects.toThrow();
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
  });
  it('interrupção não incorpora conteúdo parcial nem reserva mais trabalho', async () => {
    const ciclo = new AbortController();
    mocks.get.mockImplementationOnce(() => {
      ciclo.abort();
      return { data: null, error: { name: 'prazo' } };
    });
    await expect(processarEmailsSuporte(ciclo.signal)).rejects.toThrow();
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.get).toHaveBeenCalledOnce();
  });
});
