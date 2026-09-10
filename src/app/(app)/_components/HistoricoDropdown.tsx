'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './HistoricoDropdown.module.css';

/**
 * Promovido de builder/_components na segunda ocorrência (Consultor) — a
 * regra de dois da casa.
 *
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
export function HistoricoDropdown({
  total,
  rotulo = 'Seus projetos',
  children,
  painelClassName,
  emPortal = false,
  compactoNoCelular = false,
}: {
  total: number;
  /** "Seus projetos" no Builder, "Suas conversas" no Consultor. */
  rotulo?: string;
  children: ReactNode;
  painelClassName?: string;
  /** Sobral usa portal para sair dos filtros do cabeçalho e acomodar o teclado móvel. */
  emPortal?: boolean;
  /** No celular usa ícone com nome e contagem acessíveis, sem reduzir o alvo de toque. */
  compactoNoCelular?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const idPainel = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const [posicao, setPosicao] = useState({ top: 0, right: 0, maxHeight: 560 });

  function posicionar() {
    const rect = gatilho.current?.getBoundingClientRect();
    if (!rect) return;
    const altura = window.visualViewport?.height ?? window.innerHeight;
    const top = Math.max(16, Math.min(rect.bottom + 8, altura - 240));
    setPosicao({
      top,
      right: Math.max(16, window.innerWidth - rect.right),
      maxHeight: Math.min(560, altura - top - 16),
    });
  }

  useEffect(() => {
    if (!aberto) return;

    const aoClicar = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (!raiz.current?.contains(alvo) && !painel.current?.contains(alvo)) setAberto(false);
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        setAberto(false);
        /* O foco volta para quem abriu — sem isso, Esc joga o foco no body e a
           próxima tabulação recomeça do topo da página. */
        gatilho.current?.focus();
      }
    };

    document.addEventListener('mousedown', aoClicar);
    document.addEventListener('keydown', aoTeclar);
    if (emPortal) {
      window.addEventListener('resize', posicionar);
      window.visualViewport?.addEventListener('resize', posicionar);
    }
    return () => {
      document.removeEventListener('mousedown', aoClicar);
      document.removeEventListener('keydown', aoTeclar);
      window.removeEventListener('resize', posicionar);
      window.visualViewport?.removeEventListener('resize', posicionar);
    };
  }, [aberto, emPortal]);

  const conteudo = aberto ? (
    <div
      ref={painel}
      id={idPainel}
      data-painel-historico
      className={`${styles.painel} ${painelClassName ?? ''}`}
      style={emPortal ? { position: 'fixed', ...posicao, zIndex: 100 } : undefined}
    >
      {children}
    </div>
  ) : null;

  return (
    <div ref={raiz} className={styles.canto}>
      <button
        ref={gatilho}
        type="button"
        className={`${styles.gatilho} ${compactoNoCelular ? styles.compacto : ''}`}
        aria-expanded={aberto}
        aria-controls={idPainel}
        title={rotulo}
        onClick={() => {
          if (emPortal && !aberto) posicionar();
          setAberto((v) => !v);
        }}
      >
        {compactoNoCelular ? (
          <svg
            className={styles.iconeCompacto}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 11a9 9 0 1 1 2.6 7.4M3 4v7h7M12 7v5l3 2" />
          </svg>
        ) : null}
        <span className={styles.rotulo}>{rotulo}</span>
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
      {aberto && emPortal ? createPortal(conteudo, document.body) : conteudo}
    </div>
  );
}
