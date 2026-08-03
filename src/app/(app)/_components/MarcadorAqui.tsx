import styles from './MarcadorAqui.module.css';

/**
 * "você está aqui" — o marcador do item ATUAL de uma lista com progresso.
 *
 * Compartilhado entre a timeline de etapas da ficha de solução e o currículo do
 * curso. As duas listas respondem à mesma pergunta ("onde eu parei?") e é a
 * mesma resposta visual; escrita duas vezes, ela divergiria no primeiro ajuste —
 * e a divergência apareceria justamente entre os dois pilares.
 *
 * O CONTRASTE JÁ CUSTOU UMA CORREÇÃO: `--via-accent-ink` sobre véu de accent a
 * 10% dá 4,31:1 e reprova AA. 8% é o teto medido neste repo, e é o mesmo par que
 * o `PillEstado` usa em "em andamento".
 */
export function MarcadorAqui() {
  return <span className={styles.aqui}>você está aqui</span>;
}
