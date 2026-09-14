'use client';

import type { Room, TextStreamInfo } from 'livekit-client';
import { Button } from '@/design-system/via';

/** Configura somente a Room sintética, antes de entregá-la ao React/SDK. */
export function prepararEnvioChatSimulado(room: Room, aoMudar: (pendente: boolean) => void) {
  let finalizar: ((falhar: boolean) => void) | null = null;
  room.localParticipant.publishData = () => Promise.resolve();
  room.localParticipant.sendText = (texto) => {
    aoMudar(true);
    return new Promise<TextStreamInfo>((resolve, reject) => {
      finalizar = (falhar) => {
        finalizar = null;
        aoMudar(false);
        if (falhar) reject(new Error('Falha simulada no transporte'));
        else
          resolve({
            id: crypto.randomUUID(),
            mimeType: 'text/plain',
            topic: 'lk.chat',
            timestamp: Date.now(),
            size: new TextEncoder().encode(texto).length,
            encryptionType: 0,
          });
      };
    });
  };
  return (falhar: boolean) => finalizar?.(falhar);
}

/** Controles do transporte: não ocupam espaço ou entram na navegação da prévia. */
export function EnvioChatSimulado({
  tentativas,
  pendente,
  aoResponder,
}: {
  tentativas: number;
  pendente: boolean;
  aoResponder: (falhar: boolean) => void;
}) {
  return (
    <div hidden data-testid="transporte-chat" data-tentativas={tentativas}>
      <Button variant="secondary" disabled={!pendente} onClick={() => aoResponder(false)}>
        Concluir envio simulado
      </Button>
      <Button variant="secondary" disabled={!pendente} onClick={() => aoResponder(true)}>
        Falhar envio simulado
      </Button>
    </div>
  );
}
