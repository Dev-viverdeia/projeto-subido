import type { DossieLead } from '@/lib/crm/queries';

export function criarLeadNovo(base: DossieLead): DossieLead {
  return {
    ...base,
    oportunidade: {
      ...base.oportunidade,
      etapa: 'novo_lead',
      dominio: null,
      enriquecidoEm: null,
      enriquecimentoStatus: null,
      proximaAcao: null,
      proximaAcaoEm: null,
      ultimoFato: 'Venda adicionada ao quadro',
      ultimoFatoEm: base.oportunidade.criadoEm,
    },
    empresa: { ...base.empresa, dominio: null },
    eventos: [base.eventos.at(-1)!],
    calls: [],
    acoesPlano: [],
    enriquecimentos: [],
    totalCalls: 0,
  };
}
