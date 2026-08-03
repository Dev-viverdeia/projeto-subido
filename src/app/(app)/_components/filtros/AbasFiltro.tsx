'use client';

import { motion, useReducedMotion } from 'motion/react';
import styles from './AbasFiltro.module.css';

export type Aba = {
  id: string;
  rotulo: string;
  /** Quantos itens a aba filtra. Opcional: sem ele a aba é só o rótulo. */
  total?: number;
};

/**
 * Tabs de categoria puramente TIPOGRÁFICAS — sem caixa, sem pill, sem ring.
 * A hierarquia é peso e tinta; o único ornamento é o sublinhado de 2px que
 * DESLIZA entre as abas (FLIP via `layoutId` — o spring 420/34/0.8 vem da
 * referência, medido lá até parar de oscilar).
 *
 * Regra herdada: só a aba ativa tem sublinhado. Nenhum outro controle da régua
 * ganha um — dois sublinhados concorrentes leem como dois estados ativos.
 */
export function AbasFiltro({
  abas,
  ativa,
  aoMudar,
  layoutId,
  ariaLabel,
}: {
  abas: Aba[];
  ativa: string;
  aoMudar: (id: string) => void;
  /** Único por régua — dois grupos com o mesmo id compartilhariam o sublinhado. */
  layoutId: string;
  ariaLabel: string;
}) {
  const reduzir = useReducedMotion();

  return (
    <div role="tablist" aria-label={ariaLabel} className={styles.trilho}>
      {abas.map((aba) => {
        const ativo = aba.id === ativa;
        return (
          <button
            key={aba.id}
            role="tab"
            type="button"
            aria-selected={ativo}
            className={styles.aba}
            data-ativa={ativo ? '' : undefined}
            onClick={() => aoMudar(aba.id)}
          >
            {aba.rotulo}
            {/* A contagem é DADO, não enfeite: ela responde "vale a pena clicar?"
                antes do clique. Fica em mono e mais quieta que o rótulo, para a
                aba continuar lendo como uma palavra e não como duas. */}
            {aba.total !== undefined && <span className={styles.total}>{aba.total}</span>}
            {ativo && (
              <motion.span
                layoutId={layoutId}
                className={styles.sublinhado}
                transition={
                  reduzir
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }
                }
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
