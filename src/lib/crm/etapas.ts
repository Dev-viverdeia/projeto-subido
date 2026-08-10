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

export type IdFaseCrm = 'entrada' | 'conversa' | 'proposta' | 'fechados';

export const FASES_CRM: ReadonlyArray<{
  id: IdFaseCrm;
  rotulo: string;
  descricao: string;
  etapas: readonly EtapaCrm[];
}> = [
  {
    id: 'entrada',
    rotulo: 'Entrada',
    descricao: 'Leads para priorizar',
    etapas: ['novo_lead', 'qualificacao'],
  },
  {
    id: 'conversa',
    rotulo: 'Em conversa',
    descricao: 'Descoberta e diagnóstico',
    etapas: ['descoberta'],
  },
  {
    id: 'proposta',
    rotulo: 'Proposta',
    descricao: 'Apresentação e decisão',
    etapas: ['proposta', 'negociacao'],
  },
  {
    id: 'fechados',
    rotulo: 'Fechados',
    descricao: 'Ganhos e perdidos',
    etapas: ['ganho', 'perdido'],
  },
];

/**
 * Destinos que o profissional realmente precisa decidir na interface.
 * Qualificação e negociação continuam aceitas no banco para preservar histórico,
 * mas deixam de aparecer como trabalho extra no quadro.
 */
export const ETAPAS_MOVIMENTO_CRM: ReadonlyArray<{
  id: EtapaCrm;
  rotulo: string;
}> = [
  { id: 'novo_lead', rotulo: 'Entrada' },
  { id: 'descoberta', rotulo: 'Em conversa' },
  { id: 'proposta', rotulo: 'Proposta' },
  { id: 'ganho', rotulo: 'Ganho' },
  { id: 'perdido', rotulo: 'Perdido' },
];

export const ROTULO_ETAPA: Record<EtapaCrm, string> = Object.fromEntries(
  ETAPAS_CRM.map((etapa) => [etapa.id, etapa.rotulo]),
) as Record<EtapaCrm, string>;

export function etapaAberta(etapa: EtapaCrm): boolean {
  return etapa !== 'ganho' && etapa !== 'perdido';
}

export function faseDaEtapa(etapa: EtapaCrm): IdFaseCrm {
  return FASES_CRM.find((fase) => fase.etapas.includes(etapa))?.id ?? 'entrada';
}

export function etapaVisivel(etapa: EtapaCrm): EtapaCrm {
  if (etapa === 'qualificacao') return 'novo_lead';
  if (etapa === 'negociacao') return 'proposta';
  return etapa;
}
