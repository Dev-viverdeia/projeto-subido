'use client';

import { useRef, useState } from 'react';
import styles from './BotaoCopiar.module.css';

/** Copia o prompt e confirma por 2s. Client mínimo — só este botão hidrata. */
export function BotaoCopiar({ texto, rotuloDoQue }: { texto: string; rotuloDoQue: string }) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* Clipboard bloqueado (permissão/iframe): seleção manual continua possível. */
    }
  };

  return (
    <button
      type="button"
      className={styles.copiar}
      data-copiado={copiado ? '' : undefined}
      onClick={() => {
        void copiar();
      }}
      aria-label={`Copiar ${rotuloDoQue}`}
    >
      {copiado ? 'Copiado' : 'Copiar'}
    </button>
  );
}
