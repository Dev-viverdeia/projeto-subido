import { z } from 'zod';

export const CategoriaCoachSchema = z.enum([
  'descoberta',
  'escuta',
  'impacto',
  'valor',
  'objecao',
  'decisao',
  'risco',
]);

export const SegmentoLiveSchema = z.object({
  itemId: z.string().trim().min(1).max(180),
  texto: z.string().trim().min(1).max(4_000),
  ordinal: z.number().int().min(0).max(100_000),
  segundoReuniao: z.number().int().min(0).max(86_400),
  finalizadoEm: z.iso.datetime(),
});

export const LoteSegmentosSchema = z
  .object({
    segmentos: z.array(SegmentoLiveSchema).min(1).max(24),
  })
  .refine(
    ({ segmentos }) =>
      segmentos.reduce((total, segmento) => total + segmento.texto.length, 0) <= 24_000,
    { message: 'A transcrição enviada excede o limite por lote.' },
  );

export const RespostaCoachSchema = z.object({
  intervir: z.boolean(),
  categoria: CategoriaCoachSchema,
  prioridade: z.number().int().min(1).max(3),
  titulo: z.string().trim().min(3).max(100),
  recomendacao: z.string().trim().min(10).max(360),
  metodologia: z.string().trim().min(2).max(100),
  trecho_gatilho: z.string().trim().min(2).max(300),
  confianca: z.number().min(0).max(1),
});

export const BriefingOperacionalCallSchema = z
  .object({
    objetivo: z.string().trim().min(2).max(2_000).nullable(),
    criterio_sucesso: z.string().trim().min(2).max(2_000).nullable(),
    responsavel_cliente: z.string().trim().min(2).max(160).nullable(),
    responsavel_tecnico: z.string().trim().min(2).max(160).nullable(),
    acessos: z.array(z.string().trim().min(2).max(500)).max(12),
    limites: z.array(z.string().trim().min(2).max(500)).max(12),
    proximos_passos: z.array(z.string().trim().min(2).max(500)).max(12),
  })
  .nullable();

export const AnaliseCallSchema = z.object({
  resumo: z.string().trim().min(20).max(2_000),
  dores: z.array(z.string().trim().min(2).max(300)).max(10),
  objecoes: z.array(z.string().trim().min(2).max(300)).max(10),
  decisoes: z.array(z.string().trim().min(2).max(300)).max(10),
  compromissos: z.array(z.string().trim().min(2).max(300)).max(10),
  proximos_passos: z.array(z.string().trim().min(2).max(300)).max(10),
  oportunidades_projeto: z.array(z.string().trim().min(2).max(300)).max(8),
  lacunas: z.array(z.string().trim().min(2).max(300)).max(10),
  sinais_compra: z.array(z.string().trim().min(2).max(300)).max(8),
  briefing_operacional: BriefingOperacionalCallSchema,
  sentimento: z.enum(['positivo', 'neutro', 'cauteloso', 'negativo', 'indefinido']),
  nota_comercial: z.number().int().min(0).max(100),
});

export type SegmentoLive = z.infer<typeof SegmentoLiveSchema>;
export type RespostaCoach = z.infer<typeof RespostaCoachSchema>;
export type AnaliseCall = z.infer<typeof AnaliseCallSchema>;

export function mesclarSegmentos(
  existentes: readonly SegmentoLive[],
  recebidos: readonly SegmentoLive[],
): SegmentoLive[] {
  const porItem = new Map(existentes.map((segmento) => [segmento.itemId, segmento]));
  for (const segmento of recebidos) porItem.set(segmento.itemId, segmento);

  return [...porItem.values()].sort(
    (a, b) => a.ordinal - b.ordinal || a.finalizadoEm.localeCompare(b.finalizadoEm),
  );
}

export function textoDaTranscricao(segmentos: readonly SegmentoLive[]): string {
  return segmentos
    .map((segmento) => segmento.texto)
    .join('\n')
    .trim();
}
