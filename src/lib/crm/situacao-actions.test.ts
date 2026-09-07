import { beforeEach, describe, expect, it, vi } from 'vitest';
const { createClient, rpc, exigirRecurso, revalidatePath } = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
  exigirRecurso: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient }));
vi.mock('@/lib/planos/server', () => ({ exigirRecurso }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/consultor/revalidacao', () => ({ revalidarDirecaoOperacional: vi.fn() }));
import { alterarSituacaoOportunidade } from './situacao-actions';
const id = '11111111-1111-4111-8111-111111111111';
describe('retirada reversível do fluxo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClient.mockResolvedValue({ rpc });
    rpc.mockResolvedValue({ data: true, error: null });
  });
  it('preserva a etapa e exige motivo ao arquivar', async () => {
    expect(
      await alterarSituacaoOportunidade({
        id,
        situacao: 'arquivada',
        anterior: 'ativa',
        motivo: '',
      }),
    ).toMatchObject({ ok: false });
    expect(rpc).not.toHaveBeenCalled();
    expect(
      await alterarSituacaoOportunidade({
        id,
        situacao: 'arquivada',
        anterior: 'ativa',
        motivo: 'Retomar mais adiante',
      }),
    ).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith('crm_alterar_situacao', {
      p_oportunidade: id,
      p_situacao: 'arquivada',
      p_anterior: 'ativa',
      p_motivo: 'Retomar mais adiante',
    });
    expect(exigirRecurso).toHaveBeenCalledWith('vendas');
    expect(revalidatePath).toHaveBeenCalledWith('/metricas');
  });
  it('restaura sem sobrescrever o histórico com um novo motivo', async () => {
    expect(
      await alterarSituacaoOportunidade({
        id,
        situacao: 'ativa',
        anterior: 'desclassificada',
        motivo: '',
      }),
    ).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith(
      'crm_alterar_situacao',
      expect.objectContaining({ p_motivo: undefined }),
    );
  });
  it('não comunica sucesso em conflito de outra aba nem expõe erro interno', async () => {
    rpc.mockResolvedValue({ error: { code: '40001', message: 'private database internals' } });
    const resultado = await alterarSituacaoOportunidade({
      id,
      situacao: 'arquivada',
      anterior: 'ativa',
      motivo: 'Pausar',
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toContain('outra tela');
    expect(JSON.stringify(resultado)).not.toContain('internals');
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
