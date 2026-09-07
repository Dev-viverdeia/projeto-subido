'use client';

import { useEffect, useState } from 'react';
import { Room } from 'livekit-client';
import { RoomContext } from '@livekit/components-react';
import { PalcoReuniao } from '@/app/sala/[codigo]/PalcoReuniao';
import { CabineLiveCoach } from '@/app/sala/[codigo]/CabineLiveCoach';
import { MIDIA_INICIAL } from '@/app/sala/[codigo]/usePreparacaoMidia';
import styles from '@/app/sala/[codigo]/sala.module.css';

/** Fixture somente em desenvolvimento: nenhuma conexão ou permissão de mídia. */
export function SalaDispositivosPreview() {
  const [room, setRoom] = useState<Room | null>(null);
  const [escolhas, setEscolhas] = useState(MIDIA_INICIAL);
  useEffect(() => {
    const sala = new Room();
    let cancelado = false;
    void sala
      .simulateParticipants({
        participants: { count: 2, video: false, audio: false },
        publish: { audio: false, video: false, useRealTracks: false },
      })
      .then(() => {
        if (cancelado) {
          void sala.disconnect();
          return;
        }
        sala.localParticipant.name = 'Rafael';
        for (const participante of sala.remoteParticipants.values()) participante.name = 'Camila';
        // O simulador não atribui grants. Só os campos lidos pelo SDK são necessários nesta fixture.
        sala.localParticipant.setPermissions({
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
          canPublishSources: [],
          hidden: false,
          recorder: false,
          canSubscribeMetrics: false,
          canUpdateMetadata: false,
          agent: false,
          canManageAgentSession: false,
        } as unknown as Parameters<typeof sala.localParticipant.setPermissions>[0]);
        setRoom(sala);
      });
    return () => {
      cancelado = true;
      void sala.disconnect();
    };
  }, []);
  if (!room) return <p role="status">Preparando a prévia da sala…</p>;
  return (
    <main className={styles.salaAoVivo} data-lk-theme="default">
      <div className="lk-room-container">
        <RoomContext.Provider value={room}>
          <div className={styles.experienciaAnfitriao}>
            <div className={styles.palcoVideo}>
              <PalcoReuniao
                anfitriao
                escolhas={escolhas}
                aoMudarEscolhas={setEscolhas}
                aoFalhar={() => {}}
              />
            </div>
            <CabineLiveCoach
              ativo
              estado="escutando"
              gravacao="gravando"
              sugestao={null}
              fala="Aguardando a primeira fala…"
              tipo="descoberta"
            />
          </div>
        </RoomContext.Provider>
      </div>
    </main>
  );
}
