import { z } from 'zod';

/**
 * Validação do conteúdo administrado. Espelha as constraints do banco de
 * propósito: o CHECK é a rede de segurança, este schema é o que produz mensagem
 * de erro em português no campo certo.
 */

/**
 * Título → slug.
 *
 * `NFD` + remoção de `̀-ͯ` separa a letra do acento e joga o acento
 * fora, o que transforma "Automação" em "automacao" em vez de "automa-o" (que é o
 * que um replace ingênuo de não-alfanuméricos produz).
 */
export function gerarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

const slugSchema = z
  .string()
  .trim()
  .min(3, { error: 'O endereço precisa de ao menos 3 caracteres.' })
  .max(96, { error: 'O endereço ficou longo demais.' })
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    error: 'Use só letras minúsculas, números e hífen — sem acento nem espaço.',
  });

const tituloSchema = z
  .string()
  .trim()
  .min(3, { error: 'Dê um título.' })
  .max(140, { error: 'Título longo demais (máximo 140).' });

const resumoSchema = z
  .string()
  .trim()
  .max(400, { error: 'Resumo longo demais (máximo 400).' })
  .default('');

/**
 * URL opcional.
 *
 * Campo vazio vira `null` e não string vazia: `''` numa coluna de URL passa por
 * qualquer checagem de "tem valor?" e depois vira um `<video src="">`, que o
 * browser tenta carregar como a própria página.
 */
const urlOpcional = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .refine((v) => v === null || z.url().safeParse(v).success, {
    error: 'Endereço inválido — comece com https://',
  });

const textoOpcional = z
  .string()
  .trim()
  .max(80)
  .transform((v) => (v === '' ? null : v));

export const statusSchema = z.enum(['rascunho', 'publicado', 'arquivado'], {
  error: 'Status inválido.',
});

export const solucaoSchema = z.object({
  titulo: tituloSchema,
  slug: slugSchema,
  resumo: resumoSchema,
  categoria: textoOpcional,
  video_url: urlOpcional,
  capa_url: urlOpcional,
  status: statusSchema,
});

export const formacaoSchema = z.object({
  titulo: tituloSchema,
  slug: slugSchema,
  resumo: resumoSchema,
  capa_url: urlOpcional,
  status: statusSchema,
});

export type DadosSolucao = z.infer<typeof solucaoSchema>;
export type DadosFormacao = z.infer<typeof formacaoSchema>;
