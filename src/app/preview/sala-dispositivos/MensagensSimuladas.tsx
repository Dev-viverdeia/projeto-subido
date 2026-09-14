'use client';

import { useState } from 'react';
import { RoomEvent, type Room } from 'livekit-client';

/** Injeta recebimento no SDK local. Não publica mensagens ou acessa um servidor. */
export function MensagensSimuladas({ room, mensagens }: { room: Room; mensagens: string[] }) {
  const [carregadas, setCarregadas] = useState(false);
  if (carregadas) return null;
  return (
    <button
      type="button"
      onClick={() => {
        const participante = [...room.remoteParticipants.values()][0];
        mensagens.forEach((message, i) =>
          room.emit(
            RoomEvent.DataReceived,
            new TextEncoder().encode(
              JSON.stringify({
                id: `preview-chat-${i}`,
                timestamp: 1_800_000_000_000 + i,
                message,
              }),
            ),
            participante,
            0,
            'lk-chat-topic',
          ),
        );
        setCarregadas(true);
      }}
    >
      Simular mensagens
    </button>
  );
}
