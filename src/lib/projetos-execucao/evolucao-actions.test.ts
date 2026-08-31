import { beforeEach, describe, expect, it, vi } from 'vitest';

const { exigirRecurso, getUser, redirect, revalidatePath, rpc } = vi.hoisted(() => ({
  exigirRecurso: vi.fn(),
  getUser: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/lib/planos/server', () => ({ exigirRecurso }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ auth: { getUser }, rpc })),
}));

import { iniciarContinuidadeComercial } from './evolucao-actions';

const PROJETO_ID = '11111111-1111-4111-8111-111111111111';
const OPORTUNIDADE_ID = '22222222-2222-4222-8222-222222222222';

describe('iniciarContinuidadeComercial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: 'usuario-1' } } });
  });

  it('cria a oportunidade pelo vínculo da revisão e abre a ficha em Vendas', async () => {
    rpc.mockResolvedValue({ data: OPORTUNIDADE_ID, error: null });
    const dados = new FormData();
    dados.set('projeto', PROJETO_ID);

    await iniciarContinuidadeComercial({}, dados);

    expect(exigirRecurso).toHaveBeenCalledWith('vendas', 'pos-entrega');
    expect(rpc).toHaveBeenCalledWith('projeto_evolucao_iniciar_continuidade', {
      p_projeto_id: PROJETO_ID,
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/entregas/${PROJETO_ID}`);
    expect(revalidatePath).toHaveBeenCalledWith('/vendas');
    expect(redirect).toHaveBeenCalledWith(`/vendas/${OPORTUNIDADE_ID}?novo=1&origem=pos-entrega`);
  });

  it('mantém a entrega salva quando a oportunidade não pode ser criada', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'continuidade_indisponivel' },
    });
    const dados = new FormData();
    dados.set('projeto', PROJETO_ID);

    const resposta = await iniciarContinuidadeComercial({}, dados);

    expect(resposta.erro).toContain('A entrega continua salva');
    expect(redirect).not.toHaveBeenCalled();
  });
});
