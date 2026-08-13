import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getUser, redirect, revalidatePath, rpc } = vi.hoisted(() => ({
  getUser: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ auth: { getUser }, rpc })),
}));

import { criarLead } from './actions';

const OPORTUNIDADE_ID = '11111111-1111-4111-8111-111111111111';

function dadosValidos() {
  const dados = new FormData();
  dados.set('empresa', 'Clínica Aurora');
  dados.set('contato', 'Camila Rios');
  dados.set('email', 'camila@clinicaaurora.com.br');
  dados.set('titulo', 'Automação do atendimento');
  return dados;
}

describe('criarLead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: 'usuario-1' } } });
  });

  it('abre a preparação da oportunidade recém-criada', async () => {
    rpc.mockResolvedValue({ data: OPORTUNIDADE_ID, error: null });

    await criarLead({}, dadosValidos());

    expect(rpc).toHaveBeenCalledWith('crm_criar_lead', {
      p_empresa_nome: 'Clínica Aurora',
      p_contato_nome: 'Camila Rios',
      p_contato_email: 'camila@clinicaaurora.com.br',
      p_oportunidade_titulo: 'Automação do atendimento',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/crm');
    expect(revalidatePath).toHaveBeenCalledWith('/inicio');
    expect(revalidatePath).toHaveBeenCalledWith('/consultor');
    expect(revalidatePath).toHaveBeenCalledWith('/consultor/[id]', 'page');
    expect(redirect).toHaveBeenCalledWith(`/crm/${OPORTUNIDADE_ID}?novo=1`);
  });

  it('preserva o Projeto escolhido até a proposta', async () => {
    rpc.mockResolvedValue({ data: OPORTUNIDADE_ID, error: null });
    const dados = dadosValidos();
    dados.set('projeto', 'sdr-atendimento-qualificacao');

    await criarLead({}, dados);

    expect(redirect).toHaveBeenCalledWith(
      `/crm/${OPORTUNIDADE_ID}?novo=1&projeto=sdr-atendimento-qualificacao`,
    );
  });

  it('não navega quando o banco não devolve a oportunidade', async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    const resposta = await criarLead({}, dadosValidos());

    expect(resposta.erro).toContain('não conseguimos abrir a próxima etapa');
    expect(redirect).not.toHaveBeenCalled();
  });
});
