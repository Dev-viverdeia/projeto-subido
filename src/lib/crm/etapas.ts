import type { Enums } from '@/lib/supabase/types.generated';

export type EtapaCrm = Enums<'crm_etapa'>;

export const ETAPAS_CRM: ReadonlyArray<{
  id: EtapaCrm;
  rotulo: string;
  descricao: string;
}> = [
  { id: 'novo_lead', rotulo: 'Novos leads', descricao: 'Entraram no radar' },
  { id: 'qualificacao', rotulo: 'Qualificação', descricao: 'Aderência e contexto' },
  { id: 'descoberta', rotulo: 'Descoberta', descricao: 'Contexto em construção' },
  { id: 'proposta', rotulo: 'Proposta', descricao: 'Escopo apresentado' },
  { id: 'negociacao', rotulo: 'Negociação', descricao: 'Ajustes e decisão' },
  { id: 'ganho', rotulo: 'Ganhos', descricao: 'Projeto aprovado' },
  { id: 'perdido', rotulo: 'Perdidos', descricao: 'Oportunidade encerrada' },
];

export type IdFaseCrm = 'entrada' | 'conversa' | 'proposta' | 'desfecho';

export const FASES_CRM: ReadonlyArray<{
  id: IdFaseCrm;
  rotulo: string;
  descricao: string;
  etapas: readonly EtapaCrm[];
}> = [
  {
    id: 'entrada',
    rotulo: 'Preparar',
    descricao: 'Contato, pesquisa e abordagem',
    etapas: ['novo_lead', 'qualificacao'],
  },
  {
    id: 'conversa',
    rotulo: 'Descobrir',
    descricao: 'Problema, prioridade e decisão',
    etapas: ['descoberta'],
  },
  {
    id: 'proposta',
    rotulo: 'Propor',
    descricao: 'Proposta, follow-up e resposta',
    etapas: ['proposta', 'negociacao'],
  },
  {
    id: 'desfecho',
    rotulo: 'Desfecho',
    descricao: 'Decisão registrada',
    etapas: ['ganho', 'perdido'],
  },
];

export type FaseCrm = (typeof FASES_CRM)[number];

/**
 * Destinos que o profissional realmente precisa decidir na interface.
 * Qualificação e negociação continuam aceitas no banco para preservar histórico,
 * mas deixam de aparecer como trabalho extra no quadro.
 */
export const ETAPAS_MOVIMENTO_CRM: ReadonlyArray<{
  id: EtapaCrm;
  rotulo: string;
}> = [
  { id: 'novo_lead', rotulo: 'Preparar' },
  { id: 'descoberta', rotulo: 'Descobrir' },
  { id: 'proposta', rotulo: 'Propor' },
  { id: 'ganho', rotulo: 'Ganho' },
  { id: 'perdido', rotulo: 'Perdido' },
];

export function rotuloEtapaVisivel(etapa: EtapaCrm): string {
  if (etapa === 'ganho') return 'Ganha';
  if (etapa === 'perdido') return 'Perdida';
  return FASES_CRM.find((fase) => fase.id === faseDaEtapa(etapa))?.rotulo ?? ROTULO_ETAPA[etapa];
}

export const ROTULO_ETAPA: Record<EtapaCrm, string> = Object.fromEntries(
  ETAPAS_CRM.map((etapa) => [etapa.id, etapa.rotulo]),
) as Record<EtapaCrm, string>;

export const MOTIVOS_PERDA_CRM = [
  { id: 'sem_prioridade', rotulo: 'Não é prioridade agora' },
  { id: 'sem_orcamento', rotulo: 'Sem orçamento disponível' },
  { id: 'sem_retorno', rotulo: 'Parou de responder' },
  { id: 'outra_solucao', rotulo: 'Escolheu outra solução' },
  { id: 'momento_inadequado', rotulo: 'Momento inadequado' },
  { id: 'sem_aderencia', rotulo: 'Sem aderência ao projeto' },
  { id: 'outro', rotulo: 'Outro motivo' },
] as const;

export type MotivoPerdaCrm = (typeof MOTIVOS_PERDA_CRM)[number]['id'];

export function rotuloMotivoPerda(motivo: string | null): string {
  if (!motivo || motivo === 'nao_informado') return 'Motivo não informado';
  if (motivo === 'proposta_recusada') return 'Proposta recusada pelo cliente';
  return MOTIVOS_PERDA_CRM.find((item) => item.id === motivo)?.rotulo ?? motivo;
}

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
