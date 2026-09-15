import { z } from 'zod';
import { emailDe, telefoneDe } from '@/lib/prospeccao/contatos';

const texto = (limite: number) =>
  z
    .string()
    .trim()
    .max(limite, 'Resuma este campo.')
    .refine(
      (valor) =>
        ![...valor].some(
          (caractere) => caractere.charCodeAt(0) < 32 || caractere.charCodeAt(0) === 127,
        ),
      'Remova as quebras de linha deste campo.',
    );

export const contatoFichaSchema = z
  .object({
    oportunidade: z.uuid(),
    contatoId: z.uuid().nullable(),
    revisao: z.number().int().nonnegative().nullable(),
    nome: texto(160),
    telefone: texto(80).refine(
      (valor) => !valor || telefoneDe(valor) !== null,
      'Digite um telefone com DDD. Para outro país, use + e o código do país.',
    ),
    email: texto(254)
      .refine((valor) => !valor || emailDe(valor) !== null, 'Digite um e-mail válido.')
      .transform((valor) => valor.toLowerCase()),
  })
  .refine((valor) => (valor.contatoId === null) === (valor.revisao === null), {
    message: 'Reabra o contato para carregar os dados atuais.',
  })
  .refine((valor) => valor.contatoId || valor.nome || valor.telefone || valor.email, {
    message: 'Preencha o nome ou um canal de contato.',
    path: ['nome'],
  });

export type EntradaContatoFicha = z.input<typeof contatoFichaSchema>;
export type ResultadoContatoFicha =
  | { ok: true }
  | {
      ok: false;
      erro: string;
      conflito?: boolean;
      porCampo?: Partial<Record<'nome' | 'telefone' | 'email', string>>;
    };
