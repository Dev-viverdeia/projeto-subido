import { z } from 'zod';
import type { ThreadDoConsultor } from './queries';

export const TAMANHO_HISTORICO = 40;
export const BuscaConversasSchema = z.object({
  busca: z.string().trim().max(120).default(''),
  pagina: z.coerce.number().int().min(0).max(10000).default(0),
  dono: z.uuid(),
});
export const NomeConversaSchema = z.object({
  id: z.uuid(),
  dono: z.uuid(),
  anterior: z.string().min(1).max(120),
  titulo: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .refine((titulo) => [...titulo].every((caractere) => caractere.charCodeAt(0) >= 32)),
});
export type PaginaConversas = { threads: ThreadDoConsultor[]; total: number; mais: boolean };
export type ResultadoNome = { titulo: string; erro?: never } | { erro: string; titulo?: never };

/** O termo é literal: % e _ digitados não podem ampliar a busca. */
export function termoHistorico(busca: string) {
  return `%${busca.replace(/[\\%_]/g, '\\$&')}%`;
}
