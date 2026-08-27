import { DisconnectReason } from 'livekit-client';
import { describe, expect, it } from 'vitest';
import { atrasoDaReconexao, desconexaoPermiteRetomar } from './reconexao';

describe('recuperação de uma reunião', () => {
  it('não encerra a call quando a conexão cai sem intenção do usuário', () => {
    expect(desconexaoPermiteRetomar(DisconnectReason.SIGNAL_CLOSE)).toBe(true);
    expect(desconexaoPermiteRetomar(DisconnectReason.STATE_MISMATCH)).toBe(true);
    expect(desconexaoPermiteRetomar()).toBe(true);
  });

  it('respeita saídas e encerramentos definitivos', () => {
    expect(desconexaoPermiteRetomar(DisconnectReason.CLIENT_INITIATED)).toBe(false);
    expect(desconexaoPermiteRetomar(DisconnectReason.PARTICIPANT_REMOVED)).toBe(false);
    expect(desconexaoPermiteRetomar(DisconnectReason.ROOM_DELETED)).toBe(false);
    expect(desconexaoPermiteRetomar(DisconnectReason.ROOM_CLOSED)).toBe(false);
  });

  it('usa tentativas rápidas e limitadas para retomar a sala', () => {
    expect(atrasoDaReconexao(1)).toBe(700);
    expect(atrasoDaReconexao(2)).toBe(1_400);
    expect(atrasoDaReconexao(8)).toBe(2_100);
  });
});
