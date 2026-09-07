import { beforeEach, describe, expect, it, vi } from 'vitest';
const { from, remove, apagar, config } = vi.hoisted(() => ({
  from: vi.fn(),
  remove: vi.fn(),
  apagar: vi.fn(),
  config: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from }) }));
vi.mock('@/lib/env', () => ({ livekitEnv: config }));
vi.mock('livekit-server-sdk', () => ({
  RoomServiceClient: class {
    removeParticipant = remove;
    deleteRoom = apagar;
  },
}));
import { encerrarSalaNoProvedor, reuniaoAguardaEncerramento } from './encerramento-sala';
function preparar(status = 'processando', solicitado: string | null = '2026-09-07T03:00:00Z') {
  const consulta = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { sala_provedor: 'sala-do-banco', status, encerramento_solicitado_em: solicitado },
      error: null,
    }),
  };
  const identidades = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({
      data: [{ identidade_provedor: 'host-qa' }, { identidade_provedor: 'guest-nunca-conectado' }],
      error: null,
    }),
  };
  from.mockImplementation((tabela) => (tabela === 'calls_reunioes' ? consulta : identidades));
  return consulta;
}
beforeEach(() => {
  vi.resetAllMocks();
  config.mockReturnValue({
    LIVEKIT_URL: 'wss://qa.livekit.cloud',
    LIVEKIT_API_KEY: 'fake',
    LIVEKIT_API_SECRET: 'fake',
  });
  remove.mockResolvedValue(undefined);
  apagar.mockResolvedValue(undefined);
});
describe('revogação da sala', () => {
  it('revoga também tokens ainda não utilizados e depois fecha a sala do banco', async () => {
    const consulta = preparar();
    expect(await encerrarSalaNoProvedor('dono-qa', 'reuniao-qa')).toEqual({ status: 'encerrada' });
    expect(consulta.eq).toHaveBeenCalledWith('dono', 'dono-qa');
    expect(remove).toHaveBeenCalledWith('sala-do-banco', 'guest-nunca-conectado');
    expect(remove.mock.invocationCallOrder[1]).toBeLessThan(apagar.mock.invocationCallOrder[0]!);
  });
  it('não confunde encerramento da gravação com encerramento da sala', async () => {
    preparar('ao_vivo', null);
    await expect(encerrarSalaNoProvedor('dono-qa', 'reuniao-qa')).rejects.toThrow(
      'encerramento_nao_solicitado',
    );
    expect(apagar).not.toHaveBeenCalled();
    expect(await reuniaoAguardaEncerramento('reuniao-qa')).toBe(false);
  });
  it('falha transitória não é tratada como revogação concluída', async () => {
    preparar();
    remove.mockRejectedValue({ code: 'unavailable' });
    await expect(encerrarSalaNoProvedor('dono-qa', 'reuniao-qa')).rejects.toMatchObject({
      code: 'unavailable',
    });
    expect(apagar).not.toHaveBeenCalled();
  });
  it('identidade e sala já ausentes tornam a repetição idempotente', async () => {
    preparar('cancelada');
    remove.mockRejectedValue({ code: 'not_found' });
    apagar.mockRejectedValue({ code: 'not_found' });
    expect(await encerrarSalaNoProvedor('dono-qa', 'reuniao-qa')).toEqual({ status: 'cancelada' });
  });
  it('preserva reprocessamento de reuniões antigas já concluídas', async () => {
    preparar('concluida', null);
    expect(await reuniaoAguardaEncerramento('reuniao-qa')).toBe(true);
  });
});
