export const SITUACOES_CRM = ['ativa', 'arquivada', 'desclassificada'] as const;
export type SituacaoCrm = (typeof SITUACOES_CRM)[number];

export function estaNoFluxo(item: { situacao?: string }): boolean {
  return !item.situacao || item.situacao === 'ativa';
}

export const ROTULO_SITUACAO: Record<SituacaoCrm, string> = {
  ativa: 'No fluxo',
  arquivada: 'Arquivada',
  desclassificada: 'Desclassificada',
};
