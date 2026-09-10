import { z } from 'zod';

export const SalvarRespostaSchema = z.object({
  dono: z.string().uuid(),
  mensagem: z.string().uuid(),
  salvar: z.boolean(),
});
export const BuscarSalvasSchema = z.object({
  dono: z.string().uuid(),
  busca: z.string().trim().max(120).default(''),
  pagina: z.coerce.number().int().min(0).max(10_000).default(0),
});
export const TAMANHO_SALVAS = 20;
export type ResultadoSalvarResposta = { salva: boolean } | { erro: string };
export type RespostaSalva = {
  id: string;
  conversa: string;
  titulo: string;
  trecho: string;
  salvaEm: string;
};
export type PaginaSalvas = { respostas: RespostaSalva[]; total: number; mais: boolean };
