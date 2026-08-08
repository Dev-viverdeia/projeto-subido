import type { StatusProposta } from './queries';

export const ROTULO_STATUS_PROPOSTA: Record<StatusProposta, string> = {
  rascunho: 'Rascunho',
  pronta: 'Pronta para apresentar',
  apresentada: 'Apresentada',
  aceita: 'Aceita',
  recusada: 'Não aprovada',
};

export const PROXIMA_ACAO_STATUS: Partial<Record<StatusProposta, StatusProposta>> = {
  rascunho: 'pronta',
  pronta: 'apresentada',
};

export const ROTULO_ACAO_STATUS: Partial<Record<StatusProposta, string>> = {
  rascunho: 'Marcar como pronta',
  pronta: 'Marcar como apresentada',
};
