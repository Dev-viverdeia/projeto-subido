import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resultados, consultas, from } = vi.hoisted(() => {
  const resultados: Record<string, { data: unknown; error: unknown }> = {};
  const consultas: Record<
    string,
    { eq: ReturnType<typeof vi.fn>; limit: ReturnType<typeof vi.fn> }
  > = {};
  const from = vi.fn((tabela: string) => {
    const consulta = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve(resultados[tabela] ?? { data: [], error: null }).then(resolve),
    };
    consultas[tabela] = consulta;
    return consulta;
  });
  return { resultados, consultas, from };
});
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve({ from }) }));
vi.mock('@/lib/calls/descoberta', () => ({
  oportunidadeTemDescobertaConcluida: async () => false,
}));
vi.mock('./continuidade-pos-entrega', () => ({ obterContinuidadePosEntrega: async () => null }));
vi.mock('@/lib/errors', () => ({ handleError: () => new Error('Falha na leitura') }));

import { obterDossieLead } from './queries';

beforeEach(() => {
  vi.clearAllMocks();
  for (const chave of Object.keys(resultados)) delete resultados[chave];
  resultados.crm_oportunidades = {
    data: {
      id: 'venda-1',
      empresa_id: 'empresa-1',
      contato_principal_id: null,
      titulo: 'Projeto de IA',
      etapa: 'preparacao',
      situacao: 'ativa',
      criado_em: '2026-09-15',
      atualizado_em: '2026-09-15',
    },
    error: null,
  };
  resultados.crm_empresas = {
    data: { nome: 'Empresa', dominio: 'empresa.com.br', enriquecimento: null },
    error: null,
  };
  resultados.prospeccao_leads = { data: null, error: null };
  resultados.propostas = { data: null, error: null };
  resultados.prospeccao_carteiras = { data: { saldo: 30 }, error: null };
});

describe('leitura de contatos da ficha pela sessão', () => {
  it('consulta apenas a prospecção vinculada e devolve canais, não dados brutos', async () => {
    resultados.prospeccao_leads = {
      data: {
        telefones: ['4830289989'],
        emails: [],
        dados: {
          mapa_contatos: { telefones: ['4830289989'] },
          pagina_interna: 'payload-bruto-nao-deve-sair',
        },
        maps_url: 'https://maps.google.com/?cid=1',
      },
      error: null,
    };
    const ficha = await obterDossieLead('venda-1');
    expect(consultas.prospeccao_leads?.eq).toHaveBeenCalledWith('crm_oportunidade_id', 'venda-1');
    expect(consultas.prospeccao_leads?.limit).toHaveBeenCalledWith(1);
    expect(ficha?.contatos?.canais[0]).toMatchObject({
      valor: '(48) 3028-9989',
      fontes: [{ nome: 'Google Maps', url: 'https://maps.google.com/?cid=1' }],
    });
    expect(JSON.stringify(ficha)).not.toContain('payload-bruto-nao-deve-sair');
  });
  it('usa a cópia importada da empresa se a lista vinculada não existe', async () => {
    resultados.crm_empresas.data = {
      nome: 'Empresa',
      dominio: null,
      enriquecimento: {
        origem: 'prospeccao',
        emails: ['contato@empresa.com.br'],
        dados_publicos: {
          site_contatos: { emails: ['contato@empresa.com.br'] },
        },
        site_url: 'https://empresa.com.br',
      },
    };
    const ficha = await obterDossieLead('venda-1');
    expect(ficha?.contatos?.canais[0]).toMatchObject({
      valor: 'contato@empresa.com.br',
      fontes: [{ nome: 'Site da empresa', url: 'https://empresa.com.br/' }],
    });
  });
  it('não procura contatos se a oportunidade não está visível para a sessão', async () => {
    resultados.crm_oportunidades.data = null;
    expect(await obterDossieLead('outra-conta')).toBeNull();
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).not.toHaveBeenCalledWith('prospeccao_leads');
  });
  it('não troca uma falha da leitura por contatos antigos sem informar o erro', async () => {
    resultados.prospeccao_leads = { data: null, error: { message: 'indisponível' } };
    await expect(obterDossieLead('venda-1')).rejects.toThrow('Falha na leitura');
  });
});
