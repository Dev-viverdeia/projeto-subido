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

import { criarLead, iniciarNovoCicloCliente, moverOportunidadeKanban } from './actions';

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
    expect(revalidatePath).toHaveBeenCalledWith('/vendas');
    expect(revalidatePath).toHaveBeenCalledWith('/inicio');
    expect(redirect).toHaveBeenCalledWith(`/vendas/${OPORTUNIDADE_ID}?novo=1`);
  });

  it('preserva o Projeto escolhido até a proposta', async () => {
    rpc.mockResolvedValue({ data: OPORTUNIDADE_ID, error: null });
    const dados = dadosValidos();
    dados.set('projeto', 'sdr-atendimento-qualificacao');

    await criarLead({}, dados);

    expect(redirect).toHaveBeenCalledWith(
      `/vendas/${OPORTUNIDADE_ID}?novo=1&projeto=sdr-atendimento-qualificacao`,
    );
  });

  it('não navega quando o banco não devolve a oportunidade', async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    const resposta = await criarLead({}, dadosValidos());

    expect(resposta.erro).toContain('não conseguimos abrir a ficha');
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe('iniciarNovoCicloCliente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: 'usuario-1' } } });
  });

  it('reabre a operação na nova oportunidade da mesma empresa', async () => {
    const NOVA_OPORTUNIDADE = '77777777-7777-4777-8777-777777777777';
    rpc.mockResolvedValue({ data: NOVA_OPORTUNIDADE, error: null });
    const dados = new FormData();
    dados.set('oportunidade', OPORTUNIDADE_ID);

    await iniciarNovoCicloCliente(dados);

    expect(rpc).toHaveBeenCalledWith('crm_iniciar_novo_ciclo', {
      p_oportunidade: OPORTUNIDADE_ID,
    });
    expect(revalidatePath).toHaveBeenCalledWith('/vendas');
    expect(redirect).toHaveBeenCalledWith(`/vendas/${NOVA_OPORTUNIDADE}?novo=1`);
  });
});

describe('moverOportunidadeKanban', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registra uma perda somente quando existe motivo', async () => {
    rpc.mockResolvedValue({ data: true, error: null });

    const resultado = await moverOportunidadeKanban({
      id: OPORTUNIDADE_ID,
      etapa: 'perdido',
      motivoPerda: 'sem_prioridade',
    });

    expect(resultado).toEqual({ ok: true, movida: true });
    expect(rpc).toHaveBeenCalledWith('crm_mover_oportunidade_kanban', {
      p_oportunidade: OPORTUNIDADE_ID,
      p_etapa: 'perdido',
      p_motivo_perda: 'sem_prioridade',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/vendas');
    expect(revalidatePath).toHaveBeenCalledWith(`/vendas/${OPORTUNIDADE_ID}`);
  });

  it('recusa encerrar como perdido sem contexto', async () => {
    const resultado = await moverOportunidadeKanban({
      id: OPORTUNIDADE_ID,
      etapa: 'perdido',
    });

    expect(resultado).toEqual({ ok: false, erro: 'Escolha o motivo da perda.' });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('reabre uma oportunidade sem manter o motivo da perda', async () => {
    rpc.mockResolvedValue({ data: true, error: null });

    await moverOportunidadeKanban({ id: OPORTUNIDADE_ID, etapa: 'descoberta' });

    expect(rpc).toHaveBeenCalledWith('crm_mover_oportunidade_kanban', {
      p_oportunidade: OPORTUNIDADE_ID,
      p_etapa: 'descoberta',
      p_motivo_perda: undefined,
    });
  });
});
