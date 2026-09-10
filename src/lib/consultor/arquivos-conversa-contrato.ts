import { z } from 'zod';
import type { AnexoDoConsultor } from './anexos-contrato';

export const TAMANHO_PAGINA_ARQUIVOS = 20;
export const BuscaArquivosConversaSchema = z.object({
  conversa: z.uuid(),
  dono: z.uuid(),
  busca: z.string().trim().max(120).default(''),
  pagina: z.coerce.number().int().min(0).max(10000).default(0),
});
export type ArquivoDaConversa = Omit<AnexoDoConsultor, 'transcricao'> & {
  mensagemId: string;
  criadoEm: string;
};
export type PaginaArquivosConversa = {
  arquivos: ArquivoDaConversa[];
  total: number;
  mais: boolean;
};
