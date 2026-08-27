import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createClient,
  exigirRecurso,
  oportunidadeTemDescobertaConcluida,
  revalidatePath,
  redirect,
  rpc,
} = vi.hoisted(() => ({
  createClient: vi.fn(),
  exigirRecurso: vi.fn(),
  oportunidadeTemDescobertaConcluida: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/planos/server', () => ({ exigirRecurso }));
vi.mock('@/lib/calls/descoberta', () => ({ oportunidadeTemDescobertaConcluida }));
vi.mock('./queries', () => ({
  obterPropostaDaReuniao: vi.fn(),
}));

import { criarProposta, mudarStatusProposta } from './actions';

const PROPOSTA_ID = '11111111-1111-4111-8111-111111111111';
const OPORTUNIDADE_ID = '22222222-2222-4222-8222-222222222222';
const PROJETO_ID = '33333333-3333-4333-8333-333333333333';

function formulario(status: 'rascunho' | 'pronta' | 'apresentada' | 'aceita' | 'recusada') {
  const dados = new FormData();
  dados.set('id', PROPOSTA_ID);
  dados.set('status', status);
  return dados;
}

function consultaAtual(status = 'apresentada') {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: { status }, error: null }),
  };
}

function atualizacao(status = 'aceita') {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { versao: 4, status, oportunidade_id: OPORTUNIDADE_ID },
      error: null,
    }),
  };
}

describe('mudarStatusProposta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirect.mockImplementation((destino: string) => {
      throw new Error(`redirect:${destino}`);
    });
  });

  it('transforma a proposta aceita em projeto ativo e abre a execução', async () => {
    const atual = consultaAtual();
    const alterar = atualizacao();
    const from = vi.fn().mockReturnValueOnce(atual).mockReturnValueOnce(alterar);
    rpc.mockResolvedValue({ data: PROJETO_ID, error: null });
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usuario-1' } } }) },
      from,
      rpc,
    });

    await expect(mudarStatusProposta({}, formulario('aceita'))).rejects.toThrow(
      `redirect:/entregas/${PROJETO_ID}`,
    );

    expect(exigirRecurso).toHaveBeenCalledWith('propostas');
    expect(rpc).toHaveBeenCalledWith('projeto_iniciar', { p_proposta_id: PROPOSTA_ID });
    expect(revalidatePath).toHaveBeenCalledWith('/entregas');
    expect(revalidatePath).toHaveBeenCalledWith('/inicio');
    expect(redirect).toHaveBeenCalledWith(`/entregas/${PROJETO_ID}`);
  });

  it('mantém uma recuperação visível se a sala não puder ser criada', async () => {
    const atual = consultaAtual();
    const alterar = atualizacao();
    const from = vi.fn().mockReturnValueOnce(atual).mockReturnValueOnce(alterar);
    rpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'falha temporária' } });
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usuario-1' } } }) },
      from,
      rpc,
    });

    const resultado = await mudarStatusProposta({}, formulario('aceita'));

    expect(resultado).toMatchObject({
      sucesso: 'Venda confirmada. Abra a entrega pelo botão abaixo.',
      status: 'aceita',
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('não cria projeto quando a transição não é uma venda aceita', async () => {
    const atual = consultaAtual('rascunho');
    const alterar = atualizacao('pronta');
    const from = vi.fn().mockReturnValueOnce(atual).mockReturnValueOnce(alterar);
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usuario-1' } } }) },
      from,
      rpc,
    });

    const resultado = await mudarStatusProposta({}, formulario('pronta'));

    expect(resultado.status).toBe('pronta');
    expect(rpc).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe('criarProposta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirect.mockImplementation((destino: string) => {
      throw new Error(`redirect:${destino}`);
    });
  });

  it('não deixa um link direto pular a descoberta', async () => {
    oportunidadeTemDescobertaConcluida.mockResolvedValue(false);
    const dados = new FormData();
    dados.set('oportunidade', OPORTUNIDADE_ID);
    dados.set('origem', 'projeto:sdr-atendimento-qualificacao');
    dados.set('reuniao', '');

    await expect(criarProposta(dados)).rejects.toThrow(
      `redirect:/propostas/nova?oportunidade=${OPORTUNIDADE_ID}&erro=descoberta&projeto=sdr-atendimento-qualificacao`,
    );

    expect(oportunidadeTemDescobertaConcluida).toHaveBeenCalledWith(OPORTUNIDADE_ID);
    expect(createClient).not.toHaveBeenCalled();
  });
});
