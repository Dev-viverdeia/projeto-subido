import { z } from 'npm:zod@4.4.3';

export const PedidoEnriquecimento = z
  .object({
    oportunidade_id: z.uuid(),
    dominio: z.string().trim().max(253).optional(),
    linkedin_url: z.string().trim().max(500).optional(),
    contexto: z.string().trim().max(4000).optional(),
  })
  .refine((valor) => Boolean(valor.dominio || valor.contexto), {
    message: 'Informe o site da empresa ou algum contexto para a análise.',
  });

const TextoCurto = z.string().trim().min(1).max(500);

export const DossieGerado = z.object({
  resumo: z.string().trim().min(40).max(1000),
  empresa: z.object({
    setor: z.string().trim().min(1).max(160).nullable(),
    porte: z.string().trim().min(1).max(120).nullable(),
    cidade: z.string().trim().min(1).max(120).nullable(),
    estado: z.string().trim().min(1).max(120).nullable(),
    modeloNegocio: z.string().trim().min(1).max(300).nullable(),
  }),
  fatos: z
    .array(
      z.object({
        titulo: z.string().trim().min(1).max(120),
        valor: z.string().trim().min(1).max(600),
        origem: z.enum(['crm', 'site', 'informado']),
        urlFonte: z.url().max(1000).optional(),
      }),
    )
    .max(12),
  hipoteses: z
    .array(
      z.object({
        titulo: z.string().trim().min(1).max(140),
        explicacao: z.string().trim().min(1).max(700),
        confianca: z.enum(['alta', 'media', 'baixa']),
        comoValidar: z.string().trim().min(1).max(500),
      }),
    )
    .max(8),
  oportunidades: z
    .array(
      z.object({
        titulo: z.string().trim().min(1).max(140),
        impacto: z.string().trim().min(1).max(500),
        porQueAgora: z.string().trim().min(1).max(500),
        abertura: z.string().trim().min(1).max(700),
      }),
    )
    .max(5),
  perguntasDescoberta: z.array(TextoCurto).max(8),
  proximaAcao: z.object({
    acao: z.string().trim().min(1).max(500),
    porque: z.string().trim().min(1).max(700),
  }),
  alertas: z.array(TextoCurto).max(5),
});

export type DossieGerado = z.infer<typeof DossieGerado>;
