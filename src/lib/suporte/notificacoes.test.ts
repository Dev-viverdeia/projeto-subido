import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WebhookEventPayload } from 'resend';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  send: vi.fn(),
  config: vi.fn(),
  receber: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn(), default: { setTimeout: vi.fn() } }));
vi.mock('./servidor', () => ({ criarSistemaSuporte: () => mocks }));
vi.mock('@/lib/env', () => ({
  env: { NEXT_PUBLIC_SITE_URL: 'https://subido.example' },
  resendEnv: mocks.config,
  suporteEmailEnv: mocks.receber,
}));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));
import { conciliarNotificacaoSuporte, processarNotificacoesSuporte } from './notificacoes';

const id = 'ce3902ad-83c7-4a2d-95fe-c964b40c121a';
function banco() {
  const q = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { numero: 42, dono: 'cliente' }, error: null }),
    then(resolve: (v: { error: null }) => void) {
      resolve({ error: null });
    },
  };
  mocks.from.mockReturnValue(q);
  return q;
}
function evento(type: string, tags: Record<string, string> = { suporte_id: id }) {
  return { type, data: { email_id: 'email-teste', tags } } as WebhookEventPayload;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.config.mockReturnValue({ chave: 'teste', remetente: 'Subido <suporte@example.test>' });
  mocks.receber.mockReturnValue(null);
  mocks.rpc.mockResolvedValue({
    data: [{ id, atendimento: id, tipo: 'usuario', destinatario: 'cliente@example.test' }],
    error: null,
  });
  mocks.send.mockResolvedValue({ data: { id: 'email-teste' }, error: null });
});
describe('notificações do suporte', () => {
  it('usa idempotência e link autenticado, sem expor o conteúdo do pedido no e-mail', async () => {
    const q = banco();
    expect(await processarNotificacoesSuporte()).toEqual({ enviadas: 1, falhas: 0 });
    const [email, opcoes] = mocks.send.mock.calls[0]! as [
      { text: string; subject: string },
      { idempotencyKey: string },
    ];
    expect(opcoes).toEqual({ idempotencyKey: `suporte/${id}` });
    expect(email.text).toContain(`https://subido.example/suporte/${id}`);
    expect(email.subject).toContain('#42');
    expect(q.update).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'enviado', provider_id: 'email-teste' }),
    );
  });
  it('registra falha recuperável em vez de afirmar que enviou', async () => {
    const q = banco();
    mocks.send.mockResolvedValue({ data: null, error: { message: 'rate limit' } });
    expect(await processarNotificacoesSuporte()).toEqual({ enviadas: 0, falhas: 1 });
    expect(q.update).toHaveBeenCalledWith(expect.objectContaining({ estado: 'falhou' }));
  });
  it('inclui somente resposta pública, Reply-To opaco e encadeamento seguro', async () => {
    const q = banco();
    mocks.receber.mockReturnValue({ dominio: 'ajuda.subido.example', chave: 'a'.repeat(48) });
    mocks.rpc.mockResolvedValue({
      data: [
        { id, atendimento: id, evento: id, tipo: 'usuario', destinatario: 'cliente@example.test' },
      ],
      error: null,
    });
    q.maybeSingle
      .mockResolvedValueOnce({
        data: { texto: 'Mensagem da equipe <script>', papel: 'equipe', interna: false },
        error: null,
      })
      .mockResolvedValueOnce({ data: { message_id: '<anterior@example.test>' }, error: null });
    await processarNotificacoesSuporte();
    const enviado = mocks.send.mock.calls[0]![0] as {
      replyTo: string;
      text: string;
      html: string;
      headers: Record<string, string>;
    };
    expect(enviado.replyTo).toMatch(/^r-.*@ajuda\.subido\.example$/);
    expect(enviado.text).toContain('Mensagem da equipe');
    expect(enviado.html).toContain('&lt;script&gt;');
    expect(enviado.headers['In-Reply-To']).toBe('<anterior@example.test>');
  });
  it('nunca inclui nota interna na notificação', async () => {
    const q = banco();
    mocks.rpc.mockResolvedValue({
      data: [
        { id, atendimento: id, evento: id, tipo: 'usuario', destinatario: 'cliente@example.test' },
      ],
      error: null,
    });
    q.maybeSingle.mockResolvedValue({
      data: { texto: 'SEGREDO INTERNO', papel: 'equipe', interna: true },
      error: null,
    });
    await processarNotificacoesSuporte();
    expect(JSON.stringify(mocks.send.mock.calls)).not.toContain('SEGREDO INTERNO');
  });
  it('rejeita link de confirmação que saia do domínio', async () => {
    banco();
    mocks.rpc.mockResolvedValue({
      data: [{ id, atendimento: id, tipo: 'verificar', acesso_url: 'https://evil.test/' }],
      error: null,
    });
    expect(await processarNotificacoesSuporte()).toEqual({ enviadas: 0, falhas: 1 });
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('não trata webhooks de outros módulos como suporte', async () => {
    banco();
    expect(await conciliarNotificacaoSuporte(evento('email.delivered', {}))).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('distingue entrega confirmada de aceite e não rebaixa uma entrega com evento sent tardio', async () => {
    const q = banco();
    expect(await conciliarNotificacaoSuporte(evento('email.delivered'))).toBe(true);
    expect(q.update).toHaveBeenCalledWith(expect.objectContaining({ estado: 'entregue' }));
    expect(q.neq).toHaveBeenCalledWith('estado', 'devolvido');
    await conciliarNotificacaoSuporte(evento('email.sent'));
    expect(q.in).toHaveBeenCalledWith('estado', ['pendente', 'enviando', 'falhou', 'enviado']);
  });
});
