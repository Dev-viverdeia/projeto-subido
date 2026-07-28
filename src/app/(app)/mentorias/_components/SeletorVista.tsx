'use client';

import { motion, useReducedMotion } from 'motion/react';
import styles from './SeletorVista.module.css';

export type IdVista = 'agenda' | 'calendario';

/**
 * Seletor de VISTA (agenda ⁄ calendário) — um controle segmentado, e de propósito
 * NÃO as abas tipográficas do `AbasFiltro`.
 *
 * A tela tem dois controles ao mesmo tempo: a vista (modo de leitura) e o filtro
 * de dia (recorte dentro da agenda). Se os dois fossem abas com sublinhado
 * deslizante, a tela mostraria DOIS sublinhados ativos — que é exatamente o que a
 * regra do `AbasFiltro` proíbe, porque lê como dois estados ativos concorrentes.
 *
 * Segmentado para o MODO, tipográfico para o FILTRO: a forma carrega a hierarquia
 * antes de qualquer rótulo ser lido.
 *
 * Ícones em SVG inline — este componente é client, e importar lucide aqui
 * arrastaria a biblioteca para o bundle do browser.
 */
function IconeAgenda() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 4h11M2.5 8h11M2.5 12h7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeCalendario() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="2.2"
        y="3.2"
        width="11.6"
        height="10.6"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M2.2 6.6h11.6M5.6 2.2v2M10.4 2.2v2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const VISTAS: Array<{ id: IdVista; rotulo: string; icone: React.ReactNode }> = [
  { id: 'agenda', rotulo: 'Agenda', icone: <IconeAgenda /> },
  { id: 'calendario', rotulo: 'Calendário', icone: <IconeCalendario /> },
];

export function SeletorVista({
  ativa,
  aoMudar,
}: {
  ativa: IdVista;
  aoMudar: (id: IdVista) => void;
}) {
  const reduzir = useReducedMotion();

  return (
    <div role="tablist" aria-label="Modo de visualização" className={styles.trilho}>
      {VISTAS.map((v) => {
        const ativo = v.id === ativa;
        return (
          <button
            key={v.id}
            role="tab"
            type="button"
            aria-selected={ativo}
            className={styles.opcao}
            data-ativa={ativo ? '' : undefined}
            onClick={() => aoMudar(v.id)}
          >
            {/* O polegar mora ATRÁS do conteúdo. Animar o fundo em vez do texto é
                o que faz o rótulo não tremer durante a troca. */}
            {ativo && (
              <motion.span
                layoutId="mentorias-vista-polegar"
                className={styles.polegar}
                transition={
                  reduzir
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }
                }
              />
            )}
            <span className={styles.conteudo}>
              {v.icone}
              {v.rotulo}
            </span>
          </button>
        );
      })}
    </div>
  );
}
