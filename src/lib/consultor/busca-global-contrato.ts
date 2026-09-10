import { BuscaMensagensSchema, type MensagemEncontrada } from './busca-mensagens-contrato';

export const BuscaGlobalSchema = BuscaMensagensSchema.omit({ conversa: true });
export type PaginaBuscaGlobal = {
  mensagens: (MensagemEncontrada & { conversa: string; titulo: string })[];
  mais: boolean;
};
