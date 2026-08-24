import type { Database } from '@/lib/supabase/types.generated';

export type TipoCall = Database['public']['Enums']['calls_tipo'];
export type StatusCall = Database['public']['Enums']['calls_status'];

export const TIPOS_CALL: ReadonlyArray<{ id: TipoCall; rotulo: string; apoio: string }> = [
  { id: 'descoberta', rotulo: 'Descoberta', apoio: 'Entender contexto, dores e objetivos' },
  { id: 'follow_up', rotulo: 'Follow-up', apoio: 'Retomar decisões e próximos passos' },
  { id: 'proposta', rotulo: 'Proposta', apoio: 'Apresentar escopo e conduzir a decisão' },
  { id: 'kickoff', rotulo: 'Kickoff', apoio: 'Alinhar o início do projeto' },
  { id: 'entrega', rotulo: 'Entrega', apoio: 'Validar implementação e resultado' },
  { id: 'outro', rotulo: 'Outra', apoio: 'Uma conversa fora dos fluxos principais' },
];

export const ROTULO_TIPO_CALL = Object.fromEntries(
  TIPOS_CALL.map((tipo) => [tipo.id, tipo.rotulo]),
) as Record<TipoCall, string>;

export const ROTULO_STATUS_CALL: Record<StatusCall, string> = {
  agendada: 'Agendada',
  aguardando: 'Sala aberta',
  ao_vivo: 'Ao vivo',
  processando: 'Processando',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export function tipoCallValido(valor: unknown): valor is TipoCall {
  return typeof valor === 'string' && TIPOS_CALL.some((tipo) => tipo.id === valor);
}

export function callPodeAbrir(status: StatusCall) {
  return status === 'agendada' || status === 'aguardando' || status === 'ao_vivo';
}

const MARGEM_FINAL_SALA_MINUTOS = 60;

export function fimDaJanelaDaCall(agendadaPara: string, duracaoMinutos: number): number | null {
  const inicio = Date.parse(agendadaPara);
  if (!Number.isFinite(inicio)) return null;
  return inicio + (duracaoMinutos + MARGEM_FINAL_SALA_MINUTOS) * 60_000;
}

export function callPassouDaJanela(
  reuniao: Pick<
    { status: StatusCall; agendadaPara: string; duracaoMinutos: number },
    'status' | 'agendadaPara' | 'duracaoMinutos'
  >,
  agora: Date | number = Date.now(),
) {
  if (!callPodeAbrir(reuniao.status)) return false;
  const fim = fimDaJanelaDaCall(reuniao.agendadaPara, reuniao.duracaoMinutos);
  const referencia = agora instanceof Date ? agora.getTime() : agora;
  return fim !== null && fim < referencia;
}
