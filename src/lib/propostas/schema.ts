import { z } from 'zod';

const ClienteProposta = z.object({
  empresa: z.string().trim().min(1).max(160),
  contato: z.string().trim().max(160).nullable(),
  cargo: z.string().trim().max(160).nullable(),
  email: z
    .string()
    .trim()
    .max(320)
    .nullable()
    .refine((valor) => !valor || z.email().safeParse(valor).success, 'E-mail inválido.'),
});

const EscopoProposta = z.object({
  titulo: z.string().trim().min(2).max(140),
  descricao: z.string().trim().min(10).max(1200),
});

const MarcoCronograma = z.object({
  fase: z.string().trim().min(2).max(120),
  duracao: z.string().trim().min(1).max(80),
  descricao: z.string().trim().min(5).max(600),
});

/**
 * Fonte da verdade do documento comercial.
 *
 * O banco guarda este objeto como snapshot. CRM, Projeto e Estúdio só preenchem a
 * primeira versão; depois disso, a proposta pode evoluir sem reescrever a fonte.
 */
export const DocumentoPropostaSchema = z.object({
  cliente: ClienteProposta,
  projeto: z.object({
    titulo: z.string().trim().min(3).max(180),
    resumo: z.string().trim().min(10).max(1200),
    origem: z.enum(['catalogo', 'estudio', 'sem_base']),
  }),
  desafio: z.string().trim().min(10).max(4000),
  objetivo: z.string().trim().min(10).max(2000),
  escopo: z.array(EscopoProposta).min(1).max(10),
  entregaveis: z.array(z.string().trim().min(2).max(300)).min(1).max(12),
  cronograma: z.array(MarcoCronograma).min(1).max(8),
  investimento: z.object({
    valorCentavos: z.number().int().min(0).max(1_000_000_000_00).nullable(),
    condicoes: z.string().trim().min(3).max(1200),
  }),
  validadeDias: z.number().int().min(1).max(90),
  proximosPassos: z.array(z.string().trim().min(2).max(300)).min(1).max(6),
  observacoes: z.string().trim().max(2000).nullable(),
});

export type DocumentoProposta = z.infer<typeof DocumentoPropostaSchema>;
export type ItemEscopoProposta = DocumentoProposta['escopo'][number];
export type MarcoCronogramaProposta = DocumentoProposta['cronograma'][number];

export function lerDocumentoProposta(valor: unknown): DocumentoProposta | null {
  const resultado = DocumentoPropostaSchema.safeParse(valor);
  return resultado.success ? resultado.data : null;
}

export function formatarReais(valorCentavos: number | null): string {
  if (valorCentavos === null) return 'A definir';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(valorCentavos / 100);
}

export function reaisParaCentavos(valor: string): number | null {
  const limpo = valor
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  if (!limpo.trim()) return null;
  const numero = Number(limpo);
  return Number.isFinite(numero) && numero >= 0 ? Math.round(numero * 100) : null;
}

export function centavosParaCampo(valorCentavos: number | null): string {
  if (valorCentavos === null) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valorCentavos / 100);
}
