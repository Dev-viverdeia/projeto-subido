import { describe, expect, it } from 'vitest';
import {
  criarPlanoBase,
  detectarEtapaSobral,
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
