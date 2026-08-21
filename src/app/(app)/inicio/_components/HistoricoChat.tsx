'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './SobralChatInicio.module.css';

/** Mantém o começo da última mensagem visível sem deslocar a página inteira. */
export function HistoricoChat({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const historico = ref.current;
    if (!historico) return;
    const ultimaMensagem = historico.querySelector<HTMLElement>('ol > li:last-child');

    if (!ultimaMensagem) {
      historico.scrollTop = historico.scrollHeight;
      return;
    }

    const caixaHistorico = historico.getBoundingClientRect();
    const caixaMensagem = ultimaMensagem.getBoundingClientRect();
    historico.scrollTop = Math.max(
      0,
      historico.scrollTop + caixaMensagem.top - caixaHistorico.top - 4,
    );
  }, [children]);

  return (
    <div ref={ref} className={styles.historico} aria-live="polite">
      {children}
    </div>
  );
}
