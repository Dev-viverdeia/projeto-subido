import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createClient,
  exigirRecurso,
  oportunidadeTemDescobertaConcluida,
  revalidatePath,
  redirect,
  rpc,
  resolverReuniaoProposta,
  obterDossieLead,
  obterPerfilComercial,
  montarDocumentoInicial,
  obterPropostaDaReuniao,
} = vi.hoisted(() => ({
  createClient: vi.fn(),
  exigirRecurso: vi.fn(),
  oportunidadeTemDescobertaConcluida: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  rpc: vi.fn(),
  resolverReuniaoProposta: vi.fn(),
  obterDossieLead: vi.fn(),
  obterPerfilComercial: vi.fn(),
  montarDocumentoInicial: vi.fn(),
  obterPropostaDaReuniao: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/planos/server', () => ({ exigirRecurso }));
vi.mock('@/lib/calls/descoberta', () => ({ oportunidadeTemDescobertaConcluida }));
vi.mock('./queries', () => ({ obterPropostaDaReuniao }));
vi.mock('./contexto-reuniao', () => ({ resolverReuniaoProposta }));
vi.mock('@/lib/crm/queries', () => ({ obterDossieLead }));
vi.mock('@/lib/perfil-comercial/queries', () => ({ obterPerfilComercial }));
vi.mock('./montar', () => ({ montarDocumentoInicial }));

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

  function prepararCriacao() {
    oportunidadeTemDescobertaConcluida.mockResolvedValue(true);
    resolverReuniaoProposta.mockResolvedValue({
      oportunidade: { id: OPORTUNIDADE_ID },
      reuniao: { id: PROJETO_ID },
      analise: {
        status: 'concluida',
        resumo: 'Resposta lenta no atendimento.',
        dores: ['Demora'],
        objecoes: [],
        decisoes: ['Começar pela recepção'],
        compromissos: ['Validar acesso'],
        proximosPassos: [],
        lacunas: ['Volume mensal'],
      },
    });
    obterDossieLead.mockResolvedValue({
      oportunidade: { id: OPORTUNIDADE_ID, empresaId: 'empresa-1' },
    });
    obterPerfilComercial.mockResolvedValue(null);
    obterPropostaDaReuniao.mockResolvedValue(null);
    montarDocumentoInicial.mockReturnValue({ projeto: { titulo: 'Atendimento com IA' } });
    const consulta = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: PROPOSTA_ID }, error: null }),
    };
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usuario-1' } } }) },
      from: vi.fn().mockReturnValue(consulta),
    });
    const dados = new FormData();
    dados.set('oportunidade', OPORTUNIDADE_ID);
    dados.set('origem', 'sem-base');
    return { consulta, dados };
  }

  it('cria o rascunho com a descoberta mesmo quando o link da ficha não informa reunião', async () => {
    const { dados, consulta } = prepararCriacao();
    await expect(criarProposta(dados)).rejects.toThrow(`redirect:/propostas/${PROPOSTA_ID}`);
    expect(resolverReuniaoProposta).toHaveBeenCalledWith(OPORTUNIDADE_ID, undefined);
    expect(montarDocumentoInicial).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        resumo: 'Resposta lenta no atendimento.',
        decisoes: ['Começar pela recepção'],
        lacunas: ['Volume mensal'],
      }),
      null,
    );
    expect(consulta.insert).toHaveBeenCalledWith(
      expect.objectContaining({ oportunidade_id: OPORTUNIDADE_ID, reuniao_id: PROJETO_ID }),
    );
  });

  it('reabre a proposta da reunião sem duplicar o documento', async () => {
    const { dados, consulta } = prepararCriacao();
    obterPropostaDaReuniao.mockResolvedValue({ id: PROPOSTA_ID });
    await expect(criarProposta(dados)).rejects.toThrow(
      `redirect:/propostas/${PROPOSTA_ID}?origem=call`,
    );
    expect(consulta.insert).not.toHaveBeenCalled();
  });

  it('não salva uma reunião explícita incompatível e preserva cliente e projeto', async () => {
    const { dados, consulta } = prepararCriacao();
    dados.set('reuniao', PROJETO_ID);
    resolverReuniaoProposta.mockResolvedValue(null);
    await expect(criarProposta(dados)).rejects.toThrow(
      `redirect:/propostas/nova?oportunidade=${OPORTUNIDADE_ID}&erro=reuniao&origem=sem-base`,
    );
    expect(consulta.insert).not.toHaveBeenCalled();
  });

  it('devolve as escolhas e a reunião resolvida quando o banco não salva', async () => {
    const { dados, consulta } = prepararCriacao();
    consulta.single.mockResolvedValue({ data: null, error: { code: 'XX000' } });
    await expect(criarProposta(dados)).rejects.toThrow(
      `redirect:/propostas/nova?oportunidade=${OPORTUNIDADE_ID}&erro=salvar&origem=sem-base&reuniao=${PROJETO_ID}`,
    );
  });

  it('recupera uma criação concorrente pelo vínculo único com a reunião', async () => {
    const { dados, consulta } = prepararCriacao();
    consulta.single.mockResolvedValue({ data: null, error: { code: '23505' } });
    obterPropostaDaReuniao.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: PROPOSTA_ID });
    await expect(criarProposta(dados)).rejects.toThrow(
      `redirect:/propostas/${PROPOSTA_ID}?origem=call`,
    );
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
