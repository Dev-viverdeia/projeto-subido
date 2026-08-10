import { describe, expect, it } from 'vitest';
import {
  criarPlanoBase,
  detectarEtapaSobral,
  DirecaoMensagemSchema,
  PlanoSobralSchema,
  SinaisSobralSchema,
  type SinaisSobral,
} from './direcao';

function sinais(
  alteracoes: {
    oportunidades?: Partial<SinaisSobral['oportunidades']>;
    calls?: Partial<SinaisSobral['calls']>;
    propostas?: Partial<SinaisSobral['propostas']>;
  } = {},
): SinaisSobral {
  return SinaisSobralSchema.parse({
    momento: '2026-08-08T12:00:00.000Z',
    oportunidades: {
      total: 0,
      abertas: 0,
      semProximaAcao: 0,
      emDescoberta: 0,
      emPropostaOuNegociacao: 0,
      ganhas: 0,
      ...alteracoes.oportunidades,
    },
    calls: { total: 0, agendadas: 0, concluidas: 0, ...alteracoes.calls },
    propostas: {
      total: 0,
      rascunhos: 0,
      prontas: 0,
      apresentadas: 0,
      aceitas: 0,
      ...alteracoes.propostas,
    },
    studio: { total: 0, prontos: 0 },
    projetos: { total: 0, ativos: 0, acoesPendentes: 0, acoesAtrasadas: 0 },
    radar: [],
    catalogo: [],
    foco: null,
  });
}

describe('detectarEtapaSobral', () => {
  it.each([
    ['aprender', sinais()],
    ['prospectar', sinais({ oportunidades: { total: 1, abertas: 1 } })],
    ['vender', sinais({ propostas: { total: 1, rascunhos: 1 } })],
    ['entregar', sinais({ propostas: { total: 1, aceitas: 1 } })],
    ['evoluir', sinais({ oportunidades: { total: 2, ganhas: 2 } })],
  ] as const)('deriva %s somente dos fatos registrados', (esperada, contexto) => {
    expect(detectarEtapaSobral(contexto)).toBe(esperada);
  });

  it('não soma a mesma venda registrada em oportunidade e proposta', () => {
    const contexto = sinais({
      oportunidades: { total: 1, ganhas: 1 },
      propostas: { total: 1, aceitas: 1 },
    });

    expect(detectarEtapaSobral(contexto)).toBe('entregar');
  });
});

describe('criarPlanoBase', () => {
  it.each([
    sinais(),
    sinais({ oportunidades: { total: 1, abertas: 1, semProximaAcao: 1 } }),
    sinais({ propostas: { total: 1, prontas: 1 } }),
    sinais({ oportunidades: { total: 1, ganhas: 1 } }),
    sinais({ propostas: { total: 2, aceitas: 2 } }),
  ])('sempre produz uma direção válida com três ações', (contexto) => {
    const plano = criarPlanoBase(contexto);

    expect(PlanoSobralSchema.safeParse(plano).success).toBe(true);
    expect(plano.acoes).toHaveLength(3);
    expect(plano.proximoPasso).toEqual(plano.acoes[0]);
  });
});

describe('DirecaoMensagemSchema', () => {
  const base = {
    etapa: 'vender',
    diagnostico: 'A proposta existe e ainda depende de uma decisão explícita do cliente.',
    foco: 'Conduzir a decisão do cliente',
    proximo_passo: {
      titulo: 'Confirmar decisor e data da decisão',
      detalhe: 'Revise o escopo com quem decide e combine quando a resposta será dada.',
      evidencia: 'Decisor e data registrados na oportunidade.',
      destino: '/crm',
    },
    acoes: [
      {
        titulo: 'Confirmar decisor e data da decisão',
        detalhe: 'Revise o escopo com quem decide e combine quando a resposta será dada.',
        evidencia: 'Decisor e data registrados na oportunidade.',
        destino: '/crm',
      },
    ],
    gerado_em: '2026-08-10T18:00:00.000Z',
  } as const;

  it('preserva conversas antigas sem contexto de confirmação', () => {
    expect(DirecaoMensagemSchema.safeParse(base).success).toBe(true);
  });

  it('valida o lead original da ação sugerida', () => {
    const resultado = DirecaoMensagemSchema.safeParse({
      ...base,
      contexto_acao: {
        oportunidade_id: '11111111-1111-4111-8111-111111111111',
        empresa: 'Clínica Aurora',
        acao_sugerida: 'Confirmar decisor e data da decisão',
        acao_atual: null,
        prazo_atual: null,
      },
    });

    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.contexto_acao?.empresa).toBe('Clínica Aurora');
  });

  it('rejeita uma confirmação sem oportunidade válida', () => {
    expect(
      DirecaoMensagemSchema.safeParse({
        ...base,
        contexto_acao: {
          oportunidade_id: 'lead-atual',
          empresa: 'Clínica Aurora',
          acao_sugerida: 'Confirmar decisor e data da decisão',
          acao_atual: null,
          prazo_atual: null,
        },
      }).success,
    ).toBe(false);
  });
});
