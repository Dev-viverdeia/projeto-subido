import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpc, getUser, revalidatePath, redirect } = vi.hoisted(() => ({
  rpc: vi.fn(),
  getUser: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/lib/consultor/revalidacao', () => ({ revalidarDirecaoOperacional: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ rpc, auth: { getUser } }),
}));
import { iniciarProjetoExecucao } from './actions';

const id = '11111111-1111-4111-8111-111111111111';
function form() {
  const f = new FormData();
  f.set('proposta', id);
  return f;
}
beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: 'dono' } } });
  rpc.mockResolvedValue({ data: 'entrega', error: null });
  redirect.mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  });
});

describe('retomada da proposta para entrega', () => {
  it('revalida quadro e ficha antes de abrir a entrega', async () => {
    await expect(iniciarProjetoExecucao({}, form())).rejects.toThrow('REDIRECT:/entregas/entrega');
    expect(rpc).toHaveBeenCalledWith('projeto_iniciar', { p_proposta_id: id });
    expect(revalidatePath).toHaveBeenCalledWith('/crm');
    expect(revalidatePath).toHaveBeenCalledWith('/crm/[id]', 'page');
    expect(revalidatePath).toHaveBeenCalledWith(`/propostas/${id}`);
  });
  it('preserva a identidade da proposta para repetir após perda de conexão', async () => {
    rpc.mockRejectedValueOnce(new Error('network private detail'));
    expect((await iniciarProjetoExecucao({}, form())).erro).toBe(
      'A conexão falhou. Tente novamente para abrir a entrega.',
    );
    expect(redirect).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    await expect(iniciarProjetoExecucao({}, form())).rejects.toThrow('REDIRECT:/entregas/entrega');
    expect(rpc.mock.calls).toEqual([
      ['projeto_iniciar', { p_proposta_id: id }],
      ['projeto_iniciar', { p_proposta_id: id }],
    ]);
  });
  it('não avança com sessão expirada', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await iniciarProjetoExecucao({}, form())).erro).toContain('sessão expirou');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('não confirma a entrega se a proposta não estiver aceita', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'proposta_precisa_estar_aceita' } });
    expect((await iniciarProjetoExecucao({}, form())).erro).toContain('precisa estar aceita');
    expect(redirect).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it('rejeita entradas inválidas antes do banco', async () => {
    expect((await iniciarProjetoExecucao({}, new FormData())).erro).toBeTruthy();
    expect(getUser).not.toHaveBeenCalled();
  });
});
