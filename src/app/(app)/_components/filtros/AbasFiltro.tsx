'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useRef, type KeyboardEvent } from 'react';
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
 * SETAS DO TECLADO, e isso não é enfeite de acessibilidade: `role="tablist"` é uma
 * PROMESSA. Quem usa leitor de tela ouve "guia 2 de 4" e tenta as setas, porque é
 * assim que toda tablist funciona no padrão ARIA. Sem elas o componente anuncia um
 * contrato que não cumpre — pior que não ter papel nenhum. Junto vem o tabindex
 * rotativo: a tira inteira ocupa UMA parada de Tab, não quatro.
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
  const trilho = useRef<HTMLDivElement>(null);

  const aoTeclar = (e: KeyboardEvent<HTMLDivElement>) => {
    const indice = abas.findIndex((a) => a.id === ativa);
    let destino: number;

    switch (e.key) {
      /* Circular: da última volta para a primeira, como manda o padrão ARIA. */
      case 'ArrowRight':
        destino = (indice + 1 + abas.length) % abas.length;
        break;
      case 'ArrowLeft':
        destino = (indice - 1 + abas.length) % abas.length;
        break;
      case 'Home':
        destino = 0;
        break;
      case 'End':
        destino = abas.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    const alvo = abas[destino];
    if (!alvo) return;
    aoMudar(alvo.id);
    /* O foco acompanha a seleção — sem isso a próxima seta partiria da aba
       antiga e a navegação andaria de lado. */
    trilho.current?.querySelector<HTMLButtonElement>(`[data-id="${alvo.id}"]`)?.focus();
  };

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
            tabIndex={ativo ? 0 : -1}
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
