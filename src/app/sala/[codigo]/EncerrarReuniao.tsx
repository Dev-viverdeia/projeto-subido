'use client';
import { useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { SaidaReuniao } from './SaidaReuniao';
import styles from './PalcoReuniao.module.css';

export function EncerrarReuniao({
  aoEncerrar,
  aoSair,
}: {
  aoEncerrar?: () => Promise<void>;
  aoSair?: () => Promise<void>;
}) {
  const room = useRoomContext();
  const encerramentoConfirmado = useRef(false);
  async function encerrar() {
    if (!encerramentoConfirmado.current) {
      if (!aoEncerrar) throw new Error('Encerramento indisponível');
      await aoEncerrar();
      encerramentoConfirmado.current = true;
    }
    await room.disconnect();
  }
  return (
    <SaidaReuniao
      className={styles.sair}
      aoEncerrar={encerrar}
      aoSair={async () => {
        if (!encerramentoConfirmado.current) {
          if (!aoSair) throw new Error('Saída indisponível');
          await aoSair();
        }
        await room.disconnect();
      }}
    />
  );
}
