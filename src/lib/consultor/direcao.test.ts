import { describe, expect, it } from 'vitest';
import {
  AcaoConfirmadaCrmSchema,
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
    etapa?: SinaisSobral['jornada']['etapaAtual'];
  } = {},
): SinaisSobral {
  const etapa = alteracoes.etapa ?? 'aprender';
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
    jornada: {
      perfilCompleto: true,
      etapaAtual: etapa,
      proximoPasso: {
        id: `passo-${etapa}`,
        titulo: `Executar a etapa ${etapa}`,
        detalhe: 'Conclua o próximo movimento indicado pela jornada oficial da plataforma.',
        evidencia: 'Próximo movimento concluído e registrado.',
        destino:
          etapa === 'aprender'
            ? '/formacoes'
            : etapa === 'prospectar'
              ? '/vendas'
              : etapa === 'vender'
                ? '/propostas'
                : etapa === 'entregar'
                  ? '/solucoes'
                  : '/builder',
        acao: 'Executar agora',
      },
      evidenciasConcluidas: 3,
      totalEvidencias: 15,
      percentual: 20,
      aprendizado: {
        aulasConcluidas: 2,
        formacoesConcluidas: 0,
        etapasConcluidas: 0,
        projetosConcluidos: 0,
      },
    },
    radar: [],
    catalogo: [],
    foco: null,
  });
}

describe('detectarEtapaSobral', () => {
  it.each([
    ['aprender', sinais()],
    ['prospectar', sinais({ etapa: 'prospectar', oportunidades: { total: 1, abertas: 1 } })],
    ['vender', sinais({ etapa: 'vender', propostas: { total: 1, rascunhos: 1 } })],
    ['entregar', sinais({ etapa: 'entregar', propostas: { total: 1, aceitas: 1 } })],
    ['evoluir', sinais({ etapa: 'evoluir', oportunidades: { total: 2, ganhas: 2 } })],
  ] as const)('segue a etapa %s calculada pela jornada oficial', (esperada, contexto) => {
    expect(detectarEtapaSobral(contexto)).toBe(esperada);
  });

  it('não cria uma segunda etapa quando os contadores isolados divergem', () => {
    const contexto = sinais({
      etapa: 'entregar',
      oportunidades: { total: 1, ganhas: 1 },
      propostas: { total: 2, aceitas: 2 },
    });

    expect(detectarEtapaSobral(contexto)).toBe('entregar');
  });
});

describe('criarPlanoBase', () => {
  it.each([
    sinais(),
    sinais({ etapa: 'prospectar', oportunidades: { total: 1, abertas: 1, semProximaAcao: 1 } }),
    sinais({ etapa: 'vender', propostas: { total: 1, prontas: 1 } }),
    sinais({ etapa: 'entregar', oportunidades: { total: 1, ganhas: 1 } }),
    sinais({ etapa: 'evoluir', propostas: { total: 2, aceitas: 2 } }),
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
    const resultado = DirecaoMensagemSchema.safeParse(base);
    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.proximo_passo.destino).toBe('/vendas');
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

describe('AcaoConfirmadaCrmSchema', () => {
  const confirmada = {
    acao: 'Confirmar decisor e data da decisão',
    quando: '2026-08-12T15:00:00.000Z',
    confirmada_em: '2026-08-10T18:02:00.000Z',
    atualizado_em: '2026-08-10T18:02:00.000Z',
    status: 'pendente',
    concluida_em: null,
    historico: [
      {
        tipo: 'confirmada',
        acao_anterior: null,
        acao_nova: 'Confirmar decisor e data da decisão',
        quando_anterior: null,
        quando_novo: '2026-08-12T15:00:00.000Z',
        criado_em: '2026-08-10T18:02:00.000Z',
      },
    ],
  } as const;

  it('preserva o estado atual e a trilha de movimentos', () => {
    const resultado = AcaoConfirmadaCrmSchema.parse({
      ...confirmada,
      quando: '2026-08-14T15:00:00.000Z',
      atualizado_em: '2026-08-11T12:00:00.000Z',
      historico: [
        ...confirmada.historico,
        {
          tipo: 'remarcada',
          acao_anterior: confirmada.acao,
          acao_nova: confirmada.acao,
          quando_anterior: confirmada.quando,
          quando_novo: '2026-08-14T15:00:00.000Z',
          criado_em: '2026-08-11T12:00:00.000Z',
        },
      ],
    });

    expect(resultado.historico).toHaveLength(2);
    expect(resultado.historico[1]?.tipo).toBe('remarcada');
  });

  it('exige data de encerramento para uma ação concluída', () => {
    expect(
      AcaoConfirmadaCrmSchema.safeParse({
        ...confirmada,
        status: 'concluida',
        concluida_em: null,
      }).success,
    ).toBe(false);
  });
});
