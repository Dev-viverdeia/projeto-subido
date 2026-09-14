'use client';

import { useEffect, useRef, useState } from 'react';
import { Room } from 'livekit-client';
import { RoomContext } from '@livekit/components-react';
import { PalcoReuniao } from '@/app/sala/[codigo]/PalcoReuniao';
import { CabineLiveCoach } from '@/app/sala/[codigo]/CabineLiveCoach';
import { PainelPrivadoSala } from '@/app/sala/[codigo]/PainelPrivadoSala';
import type { PlanoCall } from '@/lib/calls/plano';
import type { TipoCall } from '@/lib/calls/tipos';
import { MIDIA_INICIAL } from '@/app/sala/[codigo]/usePreparacaoMidia';
import styles from '@/app/sala/[codigo]/sala.module.css';

/** Fixture somente em desenvolvimento: nenhuma conexão ou permissão de mídia. */
export function SalaDispositivosPreview({
  roteiro,
  convidado = false,
  falharSaida = false,
  reuniaoId,
}: {
  roteiro?: { plano: PlanoCall | null; tipo: TipoCall; ativo: boolean };
  convidado?: boolean;
  falharSaida?: boolean;
  reuniaoId?: string;
}) {
  const [room, setRoom] = useState<Room | null>(null);
  const [escolhas, setEscolhas] = useState(MIDIA_INICIAL);
  const [saidas, setSaidas] = useState(0);
  const [encerramentos, setEncerramentos] = useState(0);
  const tentativas = useRef(0);
  async function simularSaida(encerrar: boolean) {
    tentativas.current += 1;
    if (encerrar) setEncerramentos((n) => n + 1);
    else setSaidas((n) => n + 1);
    await new Promise((resolve) => setTimeout(resolve, 900));
    if (falharSaida && tentativas.current === 1) throw new Error('Falha simulada');
  }
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
    <main
      className={styles.salaAoVivo}
      data-lk-theme="default"
      data-saidas={saidas}
      data-encerramentos={encerramentos}
    >
      <h1 className="sr-only">Reunião de demonstração</h1>
      <div className="lk-room-container">
        <RoomContext.Provider value={room}>
          <div
            className={styles.experienciaAnfitriao}
            style={convidado ? { gridTemplateColumns: 'minmax(0, 1fr)' } : undefined}
          >
            <div className={styles.palcoVideo}>
              <PalcoReuniao
                anfitriao={!convidado}
                escolhas={escolhas}
                aoMudarEscolhas={setEscolhas}
                aoFalhar={() => {}}
                aoSair={() => simularSaida(false)}
                aoEncerrar={() => simularSaida(true)}
              />
            </div>
            {!convidado &&
              (roteiro ? (
                <PainelPrivadoSala
                  reuniaoId={reuniaoId}
                  plano={roteiro.plano}
                  tipo={roteiro.tipo}
                  ativo={roteiro.ativo}
                  gravacao="indisponivel"
                >
                  <CabineLiveCoach
                    embutido
                    ativo={roteiro.ativo}
                    estado="indisponivel"
                    gravacao="indisponivel"
                    plano={roteiro.plano}
                    sugestao={null}
                    fala="Aguardando a primeira fala…"
                    tipo={roteiro.tipo}
                  />
                </PainelPrivadoSala>
              ) : (
                <CabineLiveCoach
                  ativo
                  estado="escutando"
                  gravacao="gravando"
                  sugestao={null}
                  fala="Aguardando a primeira fala…"
                  tipo="descoberta"
                />
              ))}
          </div>
        </RoomContext.Provider>
      </div>
    </main>
  );
}
