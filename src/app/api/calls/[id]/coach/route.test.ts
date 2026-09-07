import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  origem: vi.fn(),
  createClient: vi.fn(),
  contexto: vi.fn(),
  persistirSegmentos: vi.fn(),
  porOrigem: vi.fn(),
  memoria: vi.fn(),
  gerar: vi.fn(),
  salvar: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('@/lib/calls/contexto-coach', () => ({ obterContextoCoach: mocks.contexto }));
vi.mock('@/lib/calls/http', () => ({
  requisicaoDaMesmaOrigem: mocks.origem,
  semCache: () => ({ 'Cache-Control': 'no-store' }),
}));
vi.mock('@/lib/calls/admin', () => ({
  persistirSegmentos: mocks.persistirSegmentos,
  obterAvaliacaoPorOrigem: mocks.porOrigem,
  persistirSugestao: mocks.salvar,
}));
vi.mock('@/lib/calls/coach-memoria', () => ({ obterMemoriaCoach: mocks.memoria }));
vi.mock('@/lib/calls/modelo-coach', () => ({
  gerarSugestaoCoach: mocks.gerar,
  ErroModeloCoach: class extends Error {},
}));
import { POST } from './route';

const id = '11111111-1111-4111-8111-111111111111';
const trecho = {
  itemId: 'trecho',
  texto: 'Hoje recebemos quarenta mensagens e demoramos duas horas para responder os interessados.',
  ordinal: 1,
  segundoReuniao: 30,
  finalizadoEm: '2026-09-06T12:00:00.000Z',
};
const chamar = () =>
  POST(
    new Request(`https://subido.viverdeia.ai/api/calls/${id}/coach`, {
      method: 'POST',
      body: JSON.stringify({ segmentos: [trecho] }),
    }),
    { params: Promise.resolve({ id }) },
  );

describe('orientação privada e contextual da reunião', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.origem.mockReturnValue(true);
    mocks.createClient.mockResolvedValue({
      auth: { getUser: () => ({ data: { user: { id: 'dono' } } }) },
    });
    mocks.contexto.mockResolvedValue({ dono: 'dono', reuniaoId: id, liveCoachAtivo: true });
    mocks.persistirSegmentos.mockResolvedValue([trecho]);
    mocks.memoria.mockResolvedValue({ ultima: null, historico: [], vigente: null });
    mocks.gerar.mockResolvedValue({
      sugestao: { intervir: true },
      modelo: 'teste',
      respostaId: 'r1',
    });
    mocks.salvar.mockResolvedValue({ id: 'nova', status: 'nova' });
  });
  it('não envia áudio ou CRM ao modelo sem autenticação', async () => {
    mocks.createClient.mockResolvedValue({ auth: { getUser: () => ({ data: { user: null } }) } });
    expect((await chamar()).status).toBe(401);
    expect(mocks.persistirSegmentos).not.toHaveBeenCalled();
    expect(mocks.gerar).not.toHaveBeenCalled();
  });
  it('nega outra origem e reuniões sem acesso', async () => {
    mocks.origem.mockReturnValue(false);
    expect((await chamar()).status).toBe(403);
    mocks.origem.mockReturnValue(true);
    mocks.contexto.mockResolvedValue(null);
    expect((await chamar()).status).toBe(404);
    expect(mocks.persistirSegmentos).not.toHaveBeenCalled();
  });
  it('mantém memória sem chamar IA quando coach está desligado', async () => {
    mocks.contexto.mockResolvedValue({ dono: 'dono', reuniaoId: id, liveCoachAtivo: false });
    expect(await (await chamar()).json()).toEqual({ estado: 'memoria', sugestao: null });
    expect(mocks.persistirSegmentos).toHaveBeenCalled();
    expect(mocks.gerar).not.toHaveBeenCalled();
  });
  it('passa orientações anteriores e remove a atual quando não há sinal novo', async () => {
    const historico = [
      { sugestao: 'Quantas mensagens chegam?', trecho_gatilho: 'Recebemos muitos contatos.' },
    ];
    mocks.memoria.mockResolvedValue({ ultima: null, historico, vigente: { id: 'antiga' } });
    mocks.gerar.mockResolvedValue({
      sugestao: { intervir: false },
      modelo: 'teste',
      respostaId: 'r1',
    });
    const response = await chamar();
    expect(await response.json()).toEqual({ estado: 'observando', sugestao: null, historico });
    expect(mocks.gerar).toHaveBeenCalledWith(
      expect.objectContaining({ anteriores: historico, segmentos: [trecho] }),
    );
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
  it('preserva os trechos durante o intervalo sem gastar outra análise', async () => {
    mocks.memoria.mockResolvedValue({
      ultima: { criada_em: new Date().toISOString() },
      historico: [],
      vigente: { id: 'atual' },
    });
    expect(await (await chamar()).json()).toMatchObject({ sugestao: { id: 'atual' } });
    expect(mocks.persistirSegmentos).toHaveBeenCalled();
    expect(mocks.gerar).not.toHaveBeenCalled();
  });
  it('não revive uma orientação antiga ao repetir a mesma requisição', async () => {
    mocks.porOrigem.mockResolvedValue({ status: 'nova', id: 'antiga' });
    expect(await (await chamar()).json()).toMatchObject({ sugestao: null });
    expect(mocks.gerar).not.toHaveBeenCalled();
  });
  it('usa o trecho mais recente persistido, não a ordem do lote recebido', async () => {
    mocks.persistirSegmentos.mockResolvedValue([trecho, { ...trecho, itemId: 'novo', ordinal: 2 }]);
    await chamar();
    expect(mocks.salvar).toHaveBeenCalledWith(expect.objectContaining({ origemItemId: 'novo' }));
  });
});
