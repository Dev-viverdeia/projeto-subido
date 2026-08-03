'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useNavegacaoPorSetas } from './useNavegacaoPorSetas';
import styles from './AbasFiltro.module.css';

export type Aba = { id: string; rotulo: string };

/**
 * Tabs de categoria puramente TIPOGRÁFICAS — sem caixa, sem pill, sem ring.
 * A hierarquia é peso e tinta; o único ornamento é o sublinhado de 2px que
 * DESLIZA entre as abas (FLIP via `layoutId` — o spring 420/34/0.8 vem da
 * referência, medido lá até parar de oscilar).
 *
 * Regra herdada: só a aba ativa tem sublinhado. Nenhum outro controle da régua
 * ganha um — dois sublinhados concorrentes leem como dois estados ativos.
 *
 * SETAS DO TECLADO em `useNavegacaoPorSetas`, dividido com o `ControleSegmentado`:
 * os dois declaram `role="tablist"`, e essa é uma PROMESSA que precisa ser cumprida
 * igual nos dois — o motivo completo está lá.
 *
 * `prefixoId` é opcional porque há dois usos diferentes. Na régua de filtros as
 * abas não controlam painel nenhum (elas filtram uma grade que continua no lugar),
 * então não há `aria-controls` a declarar. Na ficha da solução cada aba troca de
 * painel de verdade — ali o par `id`/`aria-controls` é o que amarra os dois.
 */
export function AbasFiltro({
  abas,
  ativa,
  aoMudar,
  layoutId,
  ariaLabel,
  prefixoId,
}: {
  abas: Aba[];
  ativa: string;
  aoMudar: (id: string) => void;
  /** Único por régua — dois grupos com o mesmo id compartilhariam o sublinhado. */
  layoutId: string;
  ariaLabel: string;
  /** Quando as abas controlam painéis: gera `id` e `aria-controls`. */
  prefixoId?: string;
}) {
  const reduzir = useReducedMotion();
  const { trilho, aoTeclar, tabIndexDe } = useNavegacaoPorSetas({ itens: abas, ativa, aoMudar });

  return (
    <div
      ref={trilho}
      role="tablist"
      aria-label={ariaLabel}
      className={styles.trilho}
      onKeyDown={aoTeclar}
    >
      {abas.map((aba) => {
        const ativo = aba.id === ativa;
        return (
          <button
            key={aba.id}
            role="tab"
            type="button"
            data-id={aba.id}
            id={prefixoId ? `${prefixoId}-aba-${aba.id}` : undefined}
            aria-controls={prefixoId ? `${prefixoId}-painel-${aba.id}` : undefined}
            aria-selected={ativo}
            /* Tabindex rotativo: só a aba ativa recebe Tab; as outras se alcançam
               pelas setas. É o par obrigatório do `onKeyDown` acima. */
            tabIndex={tabIndexDe(aba.id)}
            className={styles.aba}
            data-ativa={ativo ? '' : undefined}
            onClick={() => aoMudar(aba.id)}
          >
            {aba.rotulo}
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
