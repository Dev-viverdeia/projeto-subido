import type { StatusProposta } from './queries';

export const ROTULO_STATUS_PROPOSTA: Record<StatusProposta, string> = {
  rascunho: 'Rascunho',
  pronta: 'Pronta para apresentar',
  apresentada: 'Enviada',
  aceita: 'Aceita',
  recusada: 'Não aprovada',
};

/** Mesma ação para o mesmo documento no quadro, na ficha e na proposta. */
export const ROTULO_ABRIR_PROPOSTA: Record<StatusProposta, string> = {
  rascunho: 'Continuar proposta',
  pronta: 'Apresentar proposta',
  apresentada: 'Acompanhar proposta',
  aceita: 'Preparar entrega',
  recusada: 'Revisar proposta',
};

export const PROXIMA_ACAO_STATUS: Partial<Record<StatusProposta, StatusProposta>> = {
  rascunho: 'pronta',
  pronta: 'apresentada',
};

export const ROTULO_ACAO_STATUS: Partial<Record<StatusProposta, string>> = {
  rascunho: 'Marcar como pronta',
  pronta: 'Marcar como enviada',
};
