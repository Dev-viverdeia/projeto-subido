'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './PainelMaisFiltros.module.css';

export type Faceta = { id: string; rotulo: string; total: number };

/**
 * O painel "Mais filtros" — trigger pill + painel de vidro em PORTAL.
 *
 * Portal e `position: fixed` de propósito: o painel abre sobre uma grade cujos
 * cards têm `transform` no hover, e transform num ancestral cria containing block
 * — um `fixed` aninhado se ancoraria no card, não na viewport. Bug real da
 * plataforma de referência, resolvido lá do mesmo jeito.
 *
 * Ancorado pela DIREITA do trigger (o trigger vive na ponta direita da régua;
 * ancorar pela esquerda estouraria a viewport). Reposiciona em scroll/resize,
 * fecha por ESC (devolvendo o foco ao trigger) e por pointerdown fora.
 */
export function PainelMaisFiltros({
  titulo,
  opcoes,
  selecionadas,
  aoAlternar,
  aoLimpar,
}: {
  titulo: string;
  opcoes: Faceta[];
  selecionadas: string[];
  aoAlternar: (id: string) => void;
  aoLimpar: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState<{ top: number; left: number; largura: number } | null>(
    null,
  );
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    const posicionar = () => {
      const rect = gatilhoRef.current?.getBoundingClientRect();
      if (!rect) return;
      const largura = Math.min(340, window.innerWidth - 32);
      setPosicao({
        top: Math.round(rect.bottom + 8),
        left: Math.max(16, Math.round(rect.right - largura)),
        largura,
      });
    };
    posicionar();

    const aoApertar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false);
        gatilhoRef.current?.focus();
      }
    };
    const aoTocarFora = (e: PointerEvent) => {
      const alvo = e.target as Node;
      if (!painelRef.current?.contains(alvo) && !gatilhoRef.current?.contains(alvo)) {
        setAberto(false);
      }
    };

    window.addEventListener('scroll', posicionar, true);
    window.addEventListener('resize', posicionar);
    document.addEventListener('keydown', aoApertar);
    document.addEventListener('pointerdown', aoTocarFora, true);
    return () => {
      window.removeEventListener('scroll', posicionar, true);
      window.removeEventListener('resize', posicionar);
      document.removeEventListener('keydown', aoApertar);
      document.removeEventListener('pointerdown', aoTocarFora, true);
    };
  }, [aberto]);

  const n = selecionadas.length;

  return (
    <>
      <button
        ref={gatilhoRef}
        type="button"
        className={styles.gatilho}
        data-ativo={n > 0 ? '' : undefined}
        aria-expanded={aberto}
        aria-haspopup="listbox"
        onClick={() => setAberto((v) => !v)}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <path
            d="M1 3.25h11M3.5 6.5h6M5.5 9.75h2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {titulo}
        {n > 0 && <span className={styles.contador}>{n}</span>}
      </button>

      {aberto &&
        posicao &&
        createPortal(
          <div
            ref={painelRef}
            className={styles.painel}
            style={{ top: posicao.top, left: posicao.left, width: posicao.largura }}
            role="dialog"
            aria-label={`Filtrar por ${titulo.toLowerCase()}`}
          >
            <header className={styles.cabecalho}>
              <span className={styles.rotuloGrupo}>{titulo}</span>
              {n > 0 && (
                <button type="button" className={styles.limpar} onClick={aoLimpar}>
                  Limpar ({n})
                </button>
              )}
            </header>

            <div className={styles.lista} role="listbox" aria-multiselectable="true">
              {opcoes.map((opcao) => {
                const marcada = selecionadas.includes(opcao.id);
                return (
                  <button
                    key={opcao.id}
                    type="button"
                    role="option"
                    aria-selected={marcada}
                    className={styles.opcao}
                    data-marcada={marcada ? '' : undefined}
                    onClick={() => aoAlternar(opcao.id)}
                  >
                    <span className={styles.caixa} aria-hidden="true">
                      {marcada && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path
                            d="m1.8 5.2 2.2 2.2 4.2-4.6"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span className={styles.rotuloOpcao}>{opcao.rotulo}</span>
                    <span className={styles.total}>{opcao.total}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
