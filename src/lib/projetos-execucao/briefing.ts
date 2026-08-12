import { z } from 'zod';
import type { DocumentoProposta } from '@/lib/propostas/schema';
import { BriefingOperacionalCallSchema } from '@/lib/calls/coach-schema';

const ItemBriefingSchema = z.string().trim().min(2).max(500);

export const BriefingKickoffSchema = z.object({
  objetivo: z.string().trim().max(2_000),
  criterioSucesso: z.string().trim().max(2_000),
  responsavelCliente: z.string().trim().max(160),
  responsavelTecnico: z.string().trim().max(160),
  acessos: z.array(ItemBriefingSchema).max(12),
  limites: z.array(ItemBriefingSchema).max(12),
  proximosPassos: z.array(ItemBriefingSchema).max(12),
  observacoes: z.string().trim().max(4_000),
  confirmadoEm: z.iso.datetime().nullable(),
  fonteCallId: z.uuid().nullable(),
});

export type BriefingKickoff = z.infer<typeof BriefingKickoffSchema>;
export type OrigemBriefingKickoff = 'salvo' | 'kickoff' | 'proposta';

export function lerBriefingKickoff(valor: unknown): BriefingKickoff | null {
  const leitura = BriefingKickoffSchema.safeParse(valor);
  return leitura.success ? leitura.data : null;
}

export function textoParaItensBriefing(valor: FormDataEntryValue | null): string[] {
  if (typeof valor !== 'string') return [];
  return valor
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

export function montarBriefingInicial({
  documento,
  dadosAnalise,
  resumoAnalise,
  callId,
}: {
  documento: DocumentoProposta;
  dadosAnalise: unknown;
  resumoAnalise: string | null;
  callId: string | null;
}): { briefing: BriefingKickoff; origem: OrigemBriefingKickoff } {
  const registro =
    dadosAnalise && typeof dadosAnalise === 'object' && !Array.isArray(dadosAnalise)
      ? (dadosAnalise as Record<string, unknown>).briefing_operacional
      : null;
  const extraido = BriefingOperacionalCallSchema.safeParse(registro);

  if (extraido.success && extraido.data) {
    return {
      origem: 'kickoff',
      briefing: {
        objetivo: extraido.data.objetivo ?? documento.objetivo,
        criterioSucesso: extraido.data.criterio_sucesso ?? '',
        responsavelCliente: extraido.data.responsavel_cliente ?? documento.cliente.contato ?? '',
        responsavelTecnico: extraido.data.responsavel_tecnico ?? '',
        acessos: extraido.data.acessos,
        limites: extraido.data.limites,
        proximosPassos:
          extraido.data.proximos_passos.length > 0
            ? extraido.data.proximos_passos
            : documento.proximosPassos,
        observacoes: resumoAnalise ?? '',
        confirmadoEm: null,
        fonteCallId: callId,
      },
    };
  }

  return {
    origem: 'proposta',
    briefing: {
      objetivo: documento.objetivo,
      criterioSucesso: '',
      responsavelCliente: documento.cliente.contato ?? '',
      responsavelTecnico: '',
      acessos: [],
      limites: [],
      proximosPassos: documento.proximosPassos,
      observacoes: '',
      confirmadoEm: null,
      fonteCallId: null,
    },
  };
}

export function briefingPodeSerConfirmado(briefing: BriefingKickoff): boolean {
  return Boolean(
    briefing.objetivo &&
    briefing.criterioSucesso &&
    briefing.responsavelCliente &&
    briefing.responsavelTecnico &&
    briefing.acessos.length > 0 &&
    briefing.limites.length > 0 &&
    briefing.proximosPassos.length > 0,
  );
}

export function mesclarBriefingComKickoff(
  salvo: BriefingKickoff,
  extraido: BriefingKickoff,
): BriefingKickoff {
  if (salvo.confirmadoEm || !extraido.fonteCallId || salvo.fonteCallId === extraido.fonteCallId) {
    return salvo;
  }

  return {
    objetivo: salvo.objetivo || extraido.objetivo,
    criterioSucesso: salvo.criterioSucesso || extraido.criterioSucesso,
    responsavelCliente: salvo.responsavelCliente || extraido.responsavelCliente,
    responsavelTecnico: salvo.responsavelTecnico || extraido.responsavelTecnico,
    acessos: salvo.acessos.length > 0 ? salvo.acessos : extraido.acessos,
    limites: salvo.limites.length > 0 ? salvo.limites : extraido.limites,
    proximosPassos:
      salvo.proximosPassos.length > 0 ? salvo.proximosPassos : extraido.proximosPassos,
    observacoes: salvo.observacoes || extraido.observacoes,
    confirmadoEm: null,
    fonteCallId: extraido.fonteCallId,
  };
}
