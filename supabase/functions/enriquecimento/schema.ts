import { z } from 'npm:zod@4.4.3';

export const PedidoEnriquecimento = z
  .object({
    oportunidade_id: z.uuid(),
  })
  .strict();

const TextoCurto = z.string().trim().min(1).max(500);

const CamposFato = {
  titulo: z.string().trim().min(1).max(120),
  valor: z.string().trim().min(1).max(600),
  origem: z.enum(['crm', 'site', 'informado']),
};

const CamposDossie = {
  resumo: z.string().trim().min(40).max(1000),
  empresa: z.object({
    setor: z.string().trim().min(1).max(160).nullable(),
    porte: z.string().trim().min(1).max(120).nullable(),
    cidade: z.string().trim().min(1).max(120).nullable(),
    estado: z.string().trim().min(1).max(120).nullable(),
    modeloNegocio: z.string().trim().min(1).max(300).nullable(),
  }),
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
  roteiroCall: z.object({
    objetivo: z.string().trim().min(1).max(500),
    abertura: z.string().trim().min(1).max(700),
    perguntas: z
      .array(
        z.object({
          etapa: z.enum(['contexto', 'processo', 'impacto', 'decisao']),
          pergunta: z.string().trim().min(1).max(500),
          intencao: z.string().trim().min(1).max(500),
          projetoRelacionado: z.string().trim().min(1).max(140).nullable(),
        }),
      )
      .min(4)
      .max(7),
    fechamento: z.object({
      sinalParaAvancar: z.string().trim().min(1).max(500),
      frase: z.string().trim().min(1).max(700),
      proximoPasso: z.string().trim().min(1).max(500),
    }),
  }),
  proximaAcao: z.object({
    acao: z.string().trim().min(1).max(500),
    porque: z.string().trim().min(1).max(700),
  }),
  alertas: z.array(TextoCurto).max(5),
};

export const DossieGerado = z.object({
  ...CamposDossie,
  fatos: z
    .array(
      z.object({
        ...CamposFato,
        urlFonte: z.url().max(1000).optional(),
      }),
    )
    .max(12),
});

/** A OpenAI exige todos os campos como required em Structured Outputs. URL
 * ausente vira null no provedor e volta a ser omitida na normalização local. */
export const DossieGeradoOpenAI = z.object({
  ...CamposDossie,
  fatos: z
    .array(
      z.object({
        ...CamposFato,
        // O provedor estruturado não aceita `format: uri`; a normalização local
        // valida a URL antes que ela entre no dossiê ou na interface.
        urlFonte: z.string().max(1000).nullable(),
      }),
    )
    .max(12),
});

export type DossieGerado = z.infer<typeof DossieGerado>;
