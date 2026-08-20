import type { DossieLead } from '@/lib/crm/queries';

export function criarLeadEncerrado(lead: DossieLead, etapa: 'ganho' | 'perdido'): DossieLead {
  const concluidoEm = '2026-08-12T18:00:00.000Z';
  const vendaGanha = etapa === 'ganho';

  return {
    ...lead,
    oportunidade: {
      ...lead.oportunidade,
      etapa,
      proximaAcao: null,
      proximaAcaoEm: null,
      ganhaEm: vendaGanha ? concluidoEm : null,
      perdidaEm: vendaGanha ? null : concluidoEm,
      motivoPerda: vendaGanha ? null : 'momento_inadequado',
      ultimoFato: vendaGanha
        ? 'Oportunidade marcada como ganha'
        : 'Oportunidade marcada como perdida',
      ultimoFatoEm: concluidoEm,
    },
    acoesPlano: [],
  };
}
