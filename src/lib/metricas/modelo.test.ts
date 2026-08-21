import { describe, expect, it } from 'vitest';
import {
  lerPeriodoMetricas,
  montarMetricasComerciais,
  type FonteMetricasComerciais,
} from './modelo';

const AGORA = new Date('2026-08-21T15:00:00.000Z');

function fonteVazia(): FonteMetricasComerciais {
  return { leads: [], oportunidades: [], propostas: [], calls: [] };
}

describe('métricas comerciais', () => {
  it('usa 30 dias como período seguro para valores desconhecidos', () => {
    expect(lerPeriodoMetricas(undefined)).toBe('30d');
    expect(lerPeriodoMetricas('invalido')).toBe('30d');
    expect(lerPeriodoMetricas('90d')).toBe('90d');
  });

  it('separa atividade do período, funil e saúde atual do pipeline', () => {
    const fonte: FonteMetricasComerciais = {
      leads: Array.from({ length: 10 }, (_, indice) => ({
        criadoEm: `2026-08-${String(10 + indice).padStart(2, '0')}T12:00:00.000Z`,
        ultimoContatoEm: indice < 5 ? '2026-08-20T12:00:00.000Z' : null,
        tentativasContato: indice < 5 ? 1 : 0,
      })),
      oportunidades: [
        {
          criadoEm: '2026-08-12T12:00:00.000Z',
          etapa: 'ganho',
          valorCentavos: 2_000_000,
          proximaAcao: null,
          ganhaEm: '2026-08-20T12:00:00.000Z',
          perdidaEm: null,
          motivoPerda: null,
        },
        {
          criadoEm: '2026-08-13T12:00:00.000Z',
          etapa: 'perdido',
          valorCentavos: 1_200_000,
          proximaAcao: null,
          ganhaEm: null,
          perdidaEm: '2026-08-19T12:00:00.000Z',
          motivoPerda: 'preco',
        },
        {
          criadoEm: '2026-08-14T12:00:00.000Z',
          etapa: 'descoberta',
          valorCentavos: 1_800_000,
          proximaAcao: null,
          ganhaEm: null,
          perdidaEm: null,
          motivoPerda: null,
        },
      ],
      propostas: [
        { status: 'aceita', apresentadaEm: '2026-08-15T12:00:00.000Z' },
        { status: 'apresentada', apresentadaEm: '2026-08-18T12:00:00.000Z' },
      ],
      calls: [{ status: 'concluida', encerradaEm: '2026-08-17T12:00:00.000Z' }],
    };

    const metricas = montarMetricasComerciais(fonte, '30d', AGORA);

    expect(metricas.funil).toEqual({
      prospeccoes: 10,
      abordagens: 5,
      oportunidades: 3,
      propostas: 2,
      ganhos: 1,
      perdas: 1,
    });
    expect(metricas.taxas).toEqual({
      abordagem: 50,
      oportunidade: 60,
      proposta: 67,
      fechamento: 50,
      total: 10,
    });
    expect(metricas.saude).toMatchObject({
      oportunidadesAbertas: 1,
      semProximaAcao: 1,
      propostasAguardando: 1,
      callsConcluidas: 1,
      valorPipelineCentavos: 1_800_000,
      ticketMedioGanhoCentavos: 2_000_000,
    });
    expect(metricas.perdasPorMotivo).toEqual([{ motivo: 'Investimento', quantidade: 1 }]);
    expect(metricas.diagnostico.titulo).toBe('O pipeline pede próximas ações.');
  });

  it('orienta a criar uma lista quando ainda não há atividade', () => {
    const metricas = montarMetricasComerciais(fonteVazia(), 'total', AGORA);

    expect(metricas.temAtividade).toBe(false);
    expect(metricas.periodoAnterior).toBeNull();
    expect(metricas.diagnostico).toMatchObject({
      titulo: 'Ainda falta uma lista para analisar.',
      acao: { rotulo: 'Criar lista', href: '/prospeccao' },
    });
  });
});
