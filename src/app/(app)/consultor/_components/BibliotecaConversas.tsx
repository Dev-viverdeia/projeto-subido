'use client';
import { useId, useRef, useState, type ReactNode } from 'react';
import { Bookmark, History } from 'lucide-react';
import { RespostasSalvas } from './RespostasSalvas';
import styles from './RespostasSalvas.module.css';

export function BibliotecaConversas({ dono, children }: { dono?: string; children: ReactNode }) {
  const [aba, setAba] = useState(0);
  const id = useId();
  const botoes = useRef<Array<HTMLButtonElement | null>>([]);
  if (!dono) return children;
  return (
    <div className={styles.biblioteca}>
      <div role="tablist" aria-label="Consultar conversas" className={styles.abas}>
        {['Recentes', 'Salvas'].map((nome, i) => {
          const Icone = i === 0 ? History : Bookmark;
          return (
            <button
              key={nome}
              ref={(el) => {
                botoes.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-aba-${i}`}
              aria-controls={`${id}-painel-${i}`}
              aria-selected={aba === i}
              tabIndex={aba === i ? 0 : -1}
              onClick={() => setAba(i)}
              onKeyDown={(e) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
                e.preventDefault();
                const proxima = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : 1 - i;
                setAba(proxima);
                botoes.current[proxima]?.focus();
              }}
            >
              <Icone size={17} strokeWidth={1.7} aria-hidden="true" />
              {nome}
            </button>
          );
        })}
      </div>
      {[0, 1].map((i) => (
        <div
          key={i}
          role="tabpanel"
          id={`${id}-painel-${i}`}
          aria-labelledby={`${id}-aba-${i}`}
          hidden={aba !== i}
          className={styles.painel}
        >
          {aba === i ? i === 0 ? children : <RespostasSalvas key={dono} dono={dono} /> : null}
        </div>
      ))}
    </div>
  );
}
