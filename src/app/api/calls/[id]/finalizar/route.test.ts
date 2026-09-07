// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  contexto: vi.fn(),
  salvar: vi.fn(),
  solicitar: vi.fn(),
  processar: vi.fn(),
  after: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('next/server', async () => ({
  ...(await vi.importActual('next/server')),
  after: mocks.after,
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ auth: { getUser: mocks.user } }),
}));
vi.mock('@/lib/calls/contexto-coach', () => ({ obterContextoCoach: mocks.contexto }));
vi.mock('@/lib/calls/admin', () => ({ persistirSegmentos: mocks.salvar }));
vi.mock('@/lib/calls/encerramento-sala', () => ({ solicitarEncerramentoSala: mocks.solicitar }));
vi.mock('@/lib/operacoes/processar', () => ({ processarOperacaoPorId: mocks.processar }));
import { POST } from './route';
const ID = '11111111-1111-4111-8111-111111111111';
function executar(body: object, origin = 'https://subido.viverdeia.ai') {
  return POST(
    new Request(`https://subido.viverdeia.ai/api/calls/${ID}/finalizar`, {
      method: 'POST',
      headers: { origin, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: ID }) },
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ data: { user: { id: 'dono' } } });
  mocks.contexto.mockResolvedValue({ dono: 'dono', reuniaoId: ID });
  mocks.solicitar.mockResolvedValue({ id: 'job', status: 'pendente' });
});
describe('sair versus encerrar para todos', () => {
  it('refresh sem intenção explícita só persiste trechos', async () => {
    expect((await executar({ segmentos: [] })).status).toBe(200);
    expect(mocks.salvar).toHaveBeenCalledWith(expect.objectContaining({ concluir: false }));
    expect(mocks.solicitar).not.toHaveBeenCalled();
    expect(mocks.after).not.toHaveBeenCalled();
  });
  it('anfitrião solicita encerramento durável, nunca sala enviada no body', async () => {
    expect(
      (await executar({ encerrar: true, salaProvedor: 'sala-alheia', dono: 'outro' })).status,
    ).toBe(202);
    expect(mocks.solicitar).toHaveBeenCalledWith('dono', ID);
    expect(mocks.after).toHaveBeenCalledOnce();
  });
  it('nega visitante sem sessão', async () => {
    mocks.user.mockResolvedValue({ data: { user: null } });
    expect((await executar({ encerrar: true })).status).toBe(401);
    expect(mocks.solicitar).not.toHaveBeenCalled();
  });
  it('nega reunião não visível pela RLS do usuário', async () => {
    mocks.contexto.mockResolvedValue(null);
    expect((await executar({ encerrar: true })).status).toBe(404);
    expect(mocks.solicitar).not.toHaveBeenCalled();
  });
  it('nega origem diferente', async () => {
    expect((await executar({ encerrar: true }, 'https://outro.example')).status).toBe(403);
    expect(mocks.solicitar).not.toHaveBeenCalled();
  });
});
