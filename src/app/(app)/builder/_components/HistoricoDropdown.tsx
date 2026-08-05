'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import styles from './HistoricoDropdown.module.css';

/**
 * O histórico no CANTO SUPERIOR da tela: gatilho compacto à direita, painel
 * SOBREPOSTO que abre embaixo dele. A tela de criação fica inteira para a
 * pergunta, e os projetos ficam a um clique de qualquer ponto da página.
 *
 * A SEÇÃO é client; a GRADE continua server-rendered e chega por `children`.
 * No painel de ~400px a grade de `minmax(300px, 1fr)` colapsa sozinha para uma
 * coluna — nenhum CSS novo para os cards.
 *
 * SOBREPOSTO = elevação 3, a do que flutua. Fecha por clique fora e por Esc —
 * um dropdown que só fecha no próprio botão prende quem abriu por engano. O
 * painel nunca anima altura: entra por transform + opacity (regra da casa), e
 * os itens cascateiam lendo o `--i` que a grade carimba.
 */
export function HistoricoDropdown({ total, children }: { total: number; children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const idPainel = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;

    const aoClicar = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false);
        /* O foco volta para quem abriu — sem isso, Esc joga o foco no body e a
           próxima tabulação recomeça do topo da página. */
        gatilho.current?.focus();
      }
    };

    document.addEventListener('mousedown', aoClicar);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicar);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  return (
    <div ref={raiz} className={styles.canto}>
      <button
        ref={gatilho}
        type="button"
        className={styles.gatilho}
        aria-expanded={aberto}
        aria-controls={idPainel}
        onClick={() => setAberto((v) => !v)}
      >
        <span className={styles.rotulo}>Seus projetos</span>
        <span className={styles.total}>{total}</span>

        {/* Chevron inline, como na trilha: lucide aqui seria bundle de cliente
            por um glifo. */}
        <svg
          className={styles.seta}
          data-aberto={aberto ? '' : undefined}
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m4 6 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Desmonta ao fechar: a cascata roda de novo a cada abertura e nenhum
          card fica no fluxo de tabulação de um painel fechado. */}
      {aberto ? (
        <div id={idPainel} className={styles.painel}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
