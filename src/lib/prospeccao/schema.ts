import { z } from 'zod';

export const QUANTIDADES_PROSPECCAO = [5, 10, 20] as const;

export const BuscaProspeccaoSchema = z.object({
  segmento: z
    .string()
    .trim()
    .min(2, 'Diga que tipo de empresa você procura.')
    .max(160, 'Use até 160 caracteres.'),
  localizacao: z
    .string()
    .trim()
    .min(2, 'Informe uma cidade ou região.')
    .max(180, 'Use até 180 caracteres.'),
  termos: z.string().trim().max(300, 'Use até 300 caracteres.').default(''),
  quantidade: z.preprocess(
    (valor) => Number(valor),
    z.union(QUANTIDADES_PROSPECCAO.map((quantidade) => z.literal(quantidade))),
  ),
  somenteComSite: z.preprocess(
    (valor) => valor === true || valor === 'on' || valor === 'true',
    z.boolean(),
  ),
});

export type BuscaProspeccao = z.infer<typeof BuscaProspeccaoSchema>;

export const LeadProspeccaoSchema = z.object({
  chave_externa: z.string().trim().min(1).max(500),
  nome: z.string().trim().min(1).max(160),
  categoria: z.string().trim().max(160).nullable(),
  endereco: z.string().trim().max(500).nullable(),
  cidade: z.string().trim().max(120).nullable(),
  estado: z.string().trim().max(80).nullable(),
  site_url: z.url().max(2048).nullable(),
  dominio: z.string().trim().max(253).nullable(),
  telefone: z.string().trim().max(80).nullable(),
  avaliacao: z.number().min(0).max(5).nullable(),
  total_avaliacoes: z.number().int().min(0).nullable(),
  descricao: z.string().trim().max(3000).nullable(),
  fontes: z.array(z.string().trim().min(1).max(80)).max(5),
  dados: z.record(z.string(), z.unknown()),
});

export type LeadProspeccaoEntrada = z.infer<typeof LeadProspeccaoSchema>;

export function separarTermos(valor: string): string[] {
  return [
    ...new Set(
      valor
        .split(',')
        .map((termo) => termo.trim())
        .filter(Boolean),
    ),
  ].slice(0, 8);
}
