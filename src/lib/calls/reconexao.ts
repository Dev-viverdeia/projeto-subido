import { DisconnectReason } from 'livekit-client';

const MOTIVOS_DE_ENCERRAMENTO = new Set<DisconnectReason>([
  DisconnectReason.CLIENT_INITIATED,
  DisconnectReason.PARTICIPANT_REMOVED,
  DisconnectReason.ROOM_DELETED,
  DisconnectReason.ROOM_CLOSED,
]);

/** Distingue uma saída real de uma queda na qual vale preservar a reunião. */
export function desconexaoPermiteRetomar(reason?: DisconnectReason) {
  return reason === undefined || !MOTIVOS_DE_ENCERRAMENTO.has(reason);
}

export function atrasoDaReconexao(tentativa: number) {
  return Math.min(700 * Math.max(1, tentativa), 2_100);
}
