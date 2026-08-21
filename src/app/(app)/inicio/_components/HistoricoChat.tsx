'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './SobralChatInicio.module.css';

/** Mantém a última mensagem visível sem deslocar a página inteira. */
export function HistoricoChat({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const historico = ref.current;
    if (!historico) return;
    historico.scrollTop = historico.scrollHeight;
  }, [children]);

  return (
    <div ref={ref} className={styles.historico} aria-live="polite">
      {children}
    </div>
  );
}
