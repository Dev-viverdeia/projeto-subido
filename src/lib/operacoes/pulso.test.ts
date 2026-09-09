// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
const m = vi.hoisted(() => ({ rpc: vi.fn(), client: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: m.client }));
import { observarSuporte } from './pulso';
beforeEach(() => {
  vi.resetAllMocks();
  m.client.mockReturnValue(m);
  m.rpc.mockResolvedValue({ error: null });
});
describe('recibos das rotinas', () => {
  it('confirma depois de terminar, com consulta de prazo curto', async () => {
    const trabalho = vi.fn(() => {
      expect(m.rpc).not.toHaveBeenCalled();
      return Promise.resolve(2);
    });
    expect(await observarSuporte('limpeza', trabalho)).toBe(2);
    expect(m.client).toHaveBeenCalledWith({ timeoutMs: 3000 });
    expect(m.rpc).toHaveBeenCalledWith(
      'operacoes_registrar_pulso',
      expect.objectContaining({ p_fase: 'limpeza', p_falhou: false }),
    );
  });
  it('registra falha parcial sem apagar o resultado', async () => {
    expect(
      await observarSuporte(
        'envio',
        () => Promise.resolve({ falhas: 1 }),
        (r) => r.falhas > 0,
      ),
    ).toEqual({ falhas: 1 });
    expect(m.rpc).toHaveBeenCalledWith(
      'operacoes_registrar_pulso',
      expect.objectContaining({ p_falhou: true }),
    );
  });
  it('preserva a falha original sem executar outra vez', async () => {
    const trabalho = vi.fn().mockRejectedValue(new Error('origem'));
    await expect(observarSuporte('recebimento', trabalho)).rejects.toThrow('origem');
    expect(trabalho).toHaveBeenCalledOnce();
    expect(m.rpc).toHaveBeenCalledWith(
      'operacoes_registrar_pulso',
      expect.objectContaining({ p_falhou: true }),
    );
  });
  it('falha de monitoramento não repete nem bloqueia a rotina', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    m.rpc.mockRejectedValue(new Error('banco'));
    expect(await observarSuporte('envio', () => Promise.resolve(1))).toBe(1);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
