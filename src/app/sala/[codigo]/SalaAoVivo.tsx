'use client';

import { useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { MediaDeviceFailure, type DisconnectReason } from 'livekit-client';
import { MicOff, X } from 'lucide-react';
import type { ConviteCall } from '@/lib/calls/queries';
import type { PlanoCall } from '@/lib/calls/plano';
import { LiveCoach } from './LiveCoach';
import styles from './sala.module.css';

export function SalaAoVivo({
  credenciais,
  convite,
  anfitriao,
  plano,
  aoDesconectar,
}: {
  credenciais: { token: string; serverUrl: string };
  convite: ConviteCall;
  anfitriao: boolean;
  plano: PlanoCall | null;
  aoDesconectar: (reason?: DisconnectReason) => void;
}) {
  const [aviso, setAviso] = useState('');

  function avisarMidia(falha?: MediaDeviceFailure, tipo?: MediaDeviceKind) {
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
  }

  return (
    <div className={styles.salaAoVivo} data-lk-theme="default">
      <LiveKitRoom
        token={credenciais.token}
        serverUrl={credenciais.serverUrl}
        connect
        audio
        video
        onDisconnected={aoDesconectar}
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
              <VideoConference />
            </div>
            <LiveCoach
              reuniaoId={convite.reuniaoId}
              ativo={convite.liveCoachAtivo}
              plano={plano}
              tipo={convite.tipo}
            />
          </div>
        ) : (
          <VideoConference />
        )}
        {/* VideoConference já renderiza o áudio remoto. Não adicionar outro renderer. */}
      </LiveKitRoom>
    </div>
  );
}
