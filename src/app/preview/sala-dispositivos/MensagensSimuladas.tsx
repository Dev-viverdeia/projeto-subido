'use client';

import { useState } from 'react';
import { RoomEvent, type Room } from 'livekit-client';
import { Button } from '@/design-system/via';

/** Injeta recebimento no SDK local. Não publica mensagens ou acessa um servidor. */
export function MensagensSimuladas({
  room,
  mensagens,
  continuar = false,
}: {
  room: Room;
  mensagens: string[];
  continuar?: boolean;
}) {
  const [rodada, setRodada] = useState(0);
  if (rodada > 0 && !continuar) return null;
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        const participante = [...room.remoteParticipants.values()][0];
        const recebidas =
          rodada === 0
            ? mensagens
            : [`Mensagem nova ${rodada}. Podemos revisar o material atualizado.`];
        recebidas.forEach((message, i) =>
          room.emit(
            RoomEvent.DataReceived,
            new TextEncoder().encode(
              JSON.stringify({
                id: `preview-chat-${rodada}-${i}`,
                timestamp: 1_800_000_000_000 + rodada * 100 + i,
                message,
              }),
            ),
            participante,
            0,
            'lk-chat-topic',
          ),
        );
        setRodada((n) => n + 1);
      }}
    >
      {rodada === 0 ? 'Simular mensagens' : 'Receber mensagem simulada'}
    </Button>
  );
}
