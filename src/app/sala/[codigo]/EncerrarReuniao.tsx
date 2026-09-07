'use client';
import { useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { PhoneOff } from 'lucide-react';
import styles from './PalcoReuniao.module.css';

export function EncerrarReuniao({ aoEncerrar }: { aoEncerrar?: () => Promise<void> }) {
  const room = useRoomContext();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  async function encerrar() {
    if (ocupado) return;
    setOcupado(true);
    setErro('');
    try {
      if (!aoEncerrar) throw new Error('Encerramento indisponível');
      await aoEncerrar();
      await room.disconnect();
    } catch {
      setErro('Não foi possível confirmar o encerramento. Tente novamente.');
      setOcupado(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className={styles.sair}
        aria-label="Encerrar reunião"
        disabled={ocupado}
        onClick={() => void encerrar()}
      >
        <PhoneOff size={20} aria-hidden="true" />
        <span>{ocupado ? 'Encerrando…' : 'Encerrar'}</span>
      </button>
      {erro && (
        <span role="alert" className={styles.conexao}>
          {erro}
        </span>
      )}
    </>
  );
}
