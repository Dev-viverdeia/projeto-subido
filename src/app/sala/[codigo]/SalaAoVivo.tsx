'use client';

import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { ConnectionError, MediaDeviceFailure, type DisconnectReason } from 'livekit-client';
import { MicOff, X } from 'lucide-react';
import type { ConviteCall } from '@/lib/calls/queries';
import type { PlanoCall } from '@/lib/calls/plano';
import { LiveCoach } from './LiveCoach';
import { PalcoReuniao } from './PalcoReuniao';
import { salvarSaida } from './salvarSaida';
import type { EscolhasMidia } from './usePreparacaoMidia';
import styles from './sala.module.css';

export function SalaAoVivo({
  credenciais,
  convite,
  anfitriao,
  plano,
  aoDesconectar,
  aoConectar,
  aoFalharConexao,
  escolhas,
  aoMudarEscolhas,
  aoConfirmarEncerramento,
}: {
  credenciais: { token: string; serverUrl: string };
  convite: ConviteCall;
  anfitriao: boolean;
  plano: PlanoCall | null;
  aoDesconectar: (reason?: DisconnectReason) => void;
  aoConectar: () => void;
  aoFalharConexao: () => void;
  escolhas: EscolhasMidia;
  aoMudarEscolhas: Dispatch<SetStateAction<EscolhasMidia>>;
  aoConfirmarEncerramento: () => void;
}) {
  const [aviso, setAviso] = useState('');
  const encerramentoRef = useRef<((encerrar?: boolean) => Promise<void>) | null>(null);
  async function persistir(encerrar: boolean) {
    if (encerramentoRef.current) await encerramentoRef.current(encerrar);
    else await salvarSaida(convite.reuniaoId, [], encerrar);
  }
  async function encerrar() {
    // O controle de encerramento não depende da disponibilidade do Live Coach.
    await persistir(true);
    aoConfirmarEncerramento();
  }

  const avisarMidia = useCallback((falha?: MediaDeviceFailure, tipo?: MediaDeviceKind) => {
    const dispositivo =
      tipo === 'audioinput'
        ? 'o microfone'
        : tipo === 'videoinput'
          ? 'a câmera'
          : 'a câmera ou o microfone';
    setAviso(
      falha === MediaDeviceFailure.PermissionDenied
        ? `Permita ${dispositivo} nas configurações deste site e ative o controle na sala.`
        : falha === MediaDeviceFailure.DeviceInUse
          ? `Outro aplicativo pode estar usando ${dispositivo}. Feche-o e tente ativar o controle novamente.`
          : `Não foi possível acessar ${dispositivo}. Confira o dispositivo e tente ativar o controle na sala.`,
    );
  }, []);
  const tratarErro = useCallback(
    (erro: Error) => {
      // LiveKit usa onError tanto para conexão quanto para publicação da câmera/microfone.
      // Negar uma permissão de mídia não pode derrubar a sala inteira.
      if (erro instanceof ConnectionError) aoFalharConexao();
      else avisarMidia(MediaDeviceFailure.getFailure(erro));
    },
    [aoFalharConexao, avisarMidia],
  );

  return (
    <main className={styles.salaAoVivo} data-lk-theme="default">
      <h1 className="sr-only">{convite.titulo}</h1>
      <LiveKitRoom
        token={credenciais.token}
        serverUrl={credenciais.serverUrl}
        connect
        audio={escolhas.audio ? { deviceId: escolhas.microfoneId || undefined } : false}
        video={escolhas.video ? { deviceId: escolhas.cameraId || undefined } : false}
        onDisconnected={aoDesconectar}
        onConnected={aoConectar}
        onError={tratarErro}
        onMediaDeviceFailure={avisarMidia}
      >
        {aviso && (
          <div className={styles.avisoMidia} role="alert">
            <MicOff size={19} aria-hidden="true" />
            <span>{aviso}</span>
            <button
              type="button"
              onClick={() => setAviso('')}
              aria-label="Fechar orientação de câmera e microfone"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}
        {anfitriao ? (
          <div className={styles.experienciaAnfitriao}>
            <div className={styles.palcoVideo}>
              <PalcoReuniao
                anfitriao
                aoEncerrar={encerrar}
                aoSair={() => persistir(false)}
                escolhas={escolhas}
                aoMudarEscolhas={aoMudarEscolhas}
                aoFalhar={(erro, tipo) => avisarMidia(MediaDeviceFailure.getFailure(erro), tipo)}
              />
            </div>
            <LiveCoach
              encerramentoRef={encerramentoRef}
              reuniaoId={convite.reuniaoId}
              ativo={convite.liveCoachAtivo}
              plano={plano}
              tipo={convite.tipo}
            />
          </div>
        ) : (
          <PalcoReuniao
            anfitriao={false}
            escolhas={escolhas}
            aoMudarEscolhas={aoMudarEscolhas}
            aoFalhar={(erro, tipo) => avisarMidia(MediaDeviceFailure.getFailure(erro), tipo)}
          />
        )}
        {/* PalcoReuniao contém um único renderer de áudio remoto. */}
      </LiveKitRoom>
    </main>
  );
}
