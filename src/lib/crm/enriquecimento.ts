import { z } from 'zod';
import type { Enums, Json } from '@/lib/supabase/types.generated';

const DossieSchema = z.object({
  resumo: z.string(),
  empresa: z.object({
    setor: z.string().nullable(),
    porte: z.string().nullable(),
    cidade: z.string().nullable(),
    estado: z.string().nullable(),
    modeloNegocio: z.string().nullable(),
  }),
  fatos: z.array(
    z.object({
      titulo: z.string(),
      valor: z.string(),
      origem: z.enum(['crm', 'site', 'informado']),
      urlFonte: z.url().optional(),
    }),
  ),
  hipoteses: z.array(
    z.object({
      titulo: z.string(),
      explicacao: z.string(),
      confianca: z.enum(['alta', 'media', 'baixa']),
      comoValidar: z.string(),
    }),
  ),
  oportunidades: z.array(
    z.object({
      titulo: z.string(),
      impacto: z.string(),
      porQueAgora: z.string(),
      abertura: z.string(),
    }),
  ),
  perguntasDescoberta: z.array(z.string()),
  proximaAcao: z.object({ acao: z.string(), porque: z.string() }),
  alertas: z.array(z.string()),
});

const FonteSchema = z.object({
  tipo: z.enum(['crm', 'site', 'informado', 'linkedin']),
  titulo: z.string(),
  url: z.url().optional(),
  status: z.enum(['lida', 'referencia', 'indisponivel']),
});

export type DossieEnriquecido = z.infer<typeof DossieSchema>;
export type FonteEnriquecimento = z.infer<typeof FonteSchema>;
export type StatusEnriquecimento = Enums<'crm_enriquecimento_status'>;

export function lerDossie(valor: Json | null): DossieEnriquecido | null {
  const resultado = DossieSchema.safeParse(valor);
  return resultado.success ? resultado.data : null;
}

export function lerFontes(valor: Json): FonteEnriquecimento[] {
  const resultado = FonteSchema.array().safeParse(valor);
  return resultado.success ? resultado.data : [];
}

export const ROTULO_CONFIANCA: Record<DossieEnriquecido['hipoteses'][number]['confianca'], string> =
  {
    alta: 'Confiança alta',
    media: 'Confiança média',
    baixa: 'Confiança baixa',
  };

export const ROTULO_ORIGEM: Record<DossieEnriquecido['fatos'][number]['origem'], string> = {
  crm: 'CRM',
  site: 'Site público',
  informado: 'Informado por você',
};
