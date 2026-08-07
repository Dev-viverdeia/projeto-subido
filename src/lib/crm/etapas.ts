import type { Enums } from '@/lib/supabase/types.generated';

export type EtapaCrm = Enums<'crm_etapa'>;

export const ETAPAS_CRM: ReadonlyArray<{
  id: EtapaCrm;
  rotulo: string;
  descricao: string;
}> = [
  { id: 'novo_lead', rotulo: 'Novos leads', descricao: 'Entraram no radar' },
  { id: 'qualificacao', rotulo: 'Qualificação', descricao: 'Aderência e contexto' },
  { id: 'descoberta', rotulo: 'Descoberta', descricao: 'Diagnóstico em andamento' },
  { id: 'proposta', rotulo: 'Proposta', descricao: 'Escopo apresentado' },
  { id: 'negociacao', rotulo: 'Negociação', descricao: 'Ajustes e decisão' },
  { id: 'ganho', rotulo: 'Ganhos', descricao: 'Projeto aprovado' },
  { id: 'perdido', rotulo: 'Perdidos', descricao: 'Oportunidade encerrada' },
];

export const ROTULO_ETAPA: Record<EtapaCrm, string> = Object.fromEntries(
  ETAPAS_CRM.map((etapa) => [etapa.id, etapa.rotulo]),
) as Record<EtapaCrm, string>;

export function etapaAberta(etapa: EtapaCrm): boolean {
  return etapa !== 'ganho' && etapa !== 'perdido';
}
