'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import styles from './InteligenciaDeContato.module.css';

export function CopiarCanal({ valor }: { valor: string }) {
  const [estado, setEstado] = useState<'pronto' | 'copiado' | 'erro'>('pronto');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function copiar() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(valor);
      setEstado('copiado');
      timer.current = setTimeout(() => setEstado('pronto'), 2000);
    } catch {
      setEstado('erro');
    }
  }
  return (
    <span className={styles.copia}>
      <button
        type="button"
        onClick={() => void copiar()}
        aria-label={`Copiar ${valor}`}
        title="Copiar contato"
      >
        {estado === 'copiado' ? (
          <Check size={18} aria-hidden="true" />
        ) : (
          <Copy size={18} aria-hidden="true" />
        )}
      </button>
      <span role="status" className={estado === 'erro' ? styles.erroCopia : styles.srOnly}>
        {estado === 'copiado'
          ? 'Contato copiado'
          : estado === 'erro'
            ? 'Não foi possível copiar. Selecione o contato e copie manualmente.'
            : ''}
      </span>
    </span>
  );
}
