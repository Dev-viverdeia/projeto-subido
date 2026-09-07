import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  contexto: vi.fn(),
  aguarda: vi.fn(),
  reservar: vi.fn(),
  estado: vi.fn(),
  gerar: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }));
vi.mock('@/lib/calls/contexto-coach', () => ({ obterContextoCoach: m.contexto }));
vi.mock('@/lib/calls/encerramento-sala', () => ({ reuniaoAguardaEncerramento: m.aguarda }));
vi.mock('@/lib/calls/processamento-admin', () => ({
  reivindicarAnalise: m.reservar,
  obterEstadoAnalise: m.estado,
  obterSegmentosPersistidos: vi.fn(),
}));
vi.mock('@/lib/calls/modelo-coach', () => ({ gerarAnaliseCall: m.gerar }));
vi.mock('@/lib/consultor/revalidacao', () => ({ revalidarDirecaoOperacional: vi.fn() }));
import { processarPosCall } from './processamento';
beforeEach(() => {
  vi.resetAllMocks();
  m.aguarda.mockResolvedValue(true);
  m.contexto.mockResolvedValue({ dono: 'dono-qa', reuniaoId: 'call-qa' });
  m.reservar.mockResolvedValue(false);
});
it.each([
  ['concluida', 'concluida'],
  ['sem_conteudo', 'concluida_sem_analise'],
])('job duplicado com análise %s termina com sucesso e não cobra IA', async (salvo, esperado) => {
  m.estado.mockResolvedValue(salvo);
  expect(await processarPosCall('call-qa')).toBe(esperado);
  expect(m.gerar).not.toHaveBeenCalled();
});
it('reserva realmente ocupada continua aguardando', async () => {
  m.estado.mockResolvedValue('processando');
  expect(await processarPosCall('call-qa')).toBe('ja_processando');
});
