import { montarMetricasComerciais, type FonteMetricasComerciais } from '@/lib/metricas/modelo';

const AGORA = new Date('2026-08-21T15:00:00.000Z');

function iso(diasAtras: number): string {
  return new Date(AGORA.getTime() - diasAtras * 86_400_000).toISOString();
}

const FONTE: FonteMetricasComerciais = {
  leads: Array.from({ length: 42 }, (_, indice) => ({
    criadoEm: iso(27 - (indice % 26)),
    ultimoContatoEm: indice < 24 ? iso(20 - (indice % 18)) : null,
    tentativasContato: indice < 24 ? 1 + (indice % 2) : 0,
  })),
  oportunidades: [
    ...Array.from({ length: 4 }, (_, indice) => ({
      criadoEm: iso(18 - indice),
      etapa: indice % 2 === 0 ? 'descoberta' : 'proposta',
      valorCentavos: 1_800_000 + indice * 300_000,
      proximaAcao: indice === 0 ? null : 'Fazer follow-up com o cliente',
      ganhaEm: null,
      perdidaEm: null,
      motivoPerda: null,
    })),
    ...Array.from({ length: 3 }, (_, indice) => ({
      criadoEm: iso(24 - indice),
      etapa: 'ganho',
      valorCentavos: 2_000_000 + indice * 450_000,
      proximaAcao: null,
      ganhaEm: iso(12 - indice * 3),
      perdidaEm: null,
      motivoPerda: null,
    })),
    {
      criadoEm: iso(22),
      etapa: 'perdido',
      valorCentavos: 1_650_000,
      proximaAcao: null,
      ganhaEm: null,
      perdidaEm: iso(7),
      motivoPerda: 'preco',
    },
    {
      criadoEm: iso(20),
      etapa: 'perdido',
      valorCentavos: 2_200_000,
      proximaAcao: null,
      ganhaEm: null,
      perdidaEm: iso(4),
      motivoPerda: 'sem_prioridade',
    },
  ],
  propostas: [
    { status: 'aceita', apresentadaEm: iso(14) },
    { status: 'aceita', apresentadaEm: iso(12) },
    { status: 'aceita', apresentadaEm: iso(8) },
    { status: 'apresentada', apresentadaEm: iso(5) },
    { status: 'apresentada', apresentadaEm: iso(2) },
    { status: 'recusada', apresentadaEm: iso(9) },
  ],
  calls: Array.from({ length: 7 }, (_, indice) => ({
    status: 'concluida',
    encerradaEm: iso(18 - indice * 2),
  })),
};

export function criarMetricasPreview(estado?: string) {
  const fonte =
    estado === 'vazio'
      ? { leads: [], oportunidades: [], propostas: [], calls: [] }
      : estado === 'avulso'
        ? { ...FONTE, leads: FONTE.leads.slice(0, 1) }
        : FONTE;
  return montarMetricasComerciais(fonte, estado === 'total' ? 'total' : '30d', AGORA);
}
