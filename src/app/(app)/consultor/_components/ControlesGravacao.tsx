import { LoaderCircle, Mic, Square, X } from 'lucide-react';
import styles from './Conversa.module.css';

export function ControlesGravacao({
  gravando,
  preparando,
  segundos,
  ocupado,
  alternar,
  cancelar,
}: {
  gravando: boolean;
  preparando: boolean;
  segundos: number;
  ocupado: boolean;
  alternar: () => Promise<void>;
  cancelar: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className={gravando ? styles.gravando : undefined}
        onClick={() => void alternar()}
        disabled={ocupado || preparando}
        aria-label={gravando ? 'Parar gravação' : 'Gravar áudio'}
        title={gravando ? 'Parar gravação' : 'Gravar áudio'}
      >
        {preparando ? (
          <LoaderCircle size={18} className={styles.girando} aria-hidden="true" />
        ) : gravando ? (
          <Square size={14} fill="currentColor" aria-hidden="true" />
        ) : (
          <Mic size={17} strokeWidth={1.9} aria-hidden="true" />
        )}
        <span>{preparando ? 'Microfone' : gravando ? 'Parar' : 'Gravar'}</span>
      </button>
      {gravando || preparando ? (
        <button
          type="button"
          onClick={cancelar}
          aria-label="Descartar gravação"
          title="Descartar gravação"
        >
          <X size={18} aria-hidden="true" />
        </button>
      ) : null}
      {preparando ? (
        <span className={styles.tempoGravacao} role="status">
          Autorize o microfone
        </span>
      ) : gravando ? (
        <span className={styles.tempoGravacao} role="status">
          Gravando · {String(Math.floor(segundos / 60)).padStart(2, '0')}:
          {String(segundos % 60).padStart(2, '0')}
        </span>
      ) : (
        <span className={styles.dicaAtalho}>Enter envia · Shift + Enter cria uma linha</span>
      )}
    </>
  );
}
