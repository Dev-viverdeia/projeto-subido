import type { Tables } from '@/lib/supabase/types.generated';
import type { StatusCall, TipoCall } from './tipos';

type LinhaReuniao = Tables<'calls_reunioes'>;

export type ReuniaoCall = {
  id: string;
  titulo: string;
  tipo: TipoCall;
  status: StatusCall;
  agendadaPara: string;
  duracaoMinutos: number;
  codigoPublico: string;
  liveCoachAtivo: boolean;
  oportunidadeId: string;
  oportunidade: string;
  empresa: string;
  contato: string | null;
  convidadoEmail: string | null;
  googleSyncStatus: 'nao_solicitado' | 'sincronizando' | 'sincronizado' | 'falhou';
  googleEventUrl: string | null;
  googleSyncErro: string | null;
  criadaEm: string;
};

function statusGoogleValido(valor: string): valor is ReuniaoCall['googleSyncStatus'] {
  return ['nao_solicitado', 'sincronizando', 'sincronizado', 'falhou'].includes(valor);
}

export function montarReuniao(
  linha: Pick<
    LinhaReuniao,
    | 'id'
    | 'titulo'
    | 'tipo'
    | 'status'
    | 'agendada_para'
    | 'duracao_minutos'
    | 'codigo_publico'
    | 'live_coach_ativo'
    | 'oportunidade_id'
    | 'convidado_email'
    | 'google_sync_status'
    | 'google_event_url'
    | 'google_sync_erro'
    | 'criada_em'
  >,
  oportunidade: { titulo: string; empresa: string; contato: string | null } | undefined,
): ReuniaoCall {
  return {
    id: linha.id,
    titulo: linha.titulo,
    tipo: linha.tipo,
    status: linha.status,
    agendadaPara: linha.agendada_para,
    duracaoMinutos: linha.duracao_minutos,
    codigoPublico: linha.codigo_publico,
    liveCoachAtivo: linha.live_coach_ativo,
    oportunidadeId: linha.oportunidade_id,
    oportunidade: oportunidade?.titulo ?? 'Oportunidade não encontrada',
    empresa: oportunidade?.empresa ?? 'Empresa não encontrada',
    contato: oportunidade?.contato ?? null,
    convidadoEmail: linha.convidado_email,
    googleSyncStatus: statusGoogleValido(linha.google_sync_status)
      ? linha.google_sync_status
      : 'nao_solicitado',
    googleEventUrl: linha.google_event_url,
    googleSyncErro: linha.google_sync_erro,
    criadaEm: linha.criada_em,
  };
}
