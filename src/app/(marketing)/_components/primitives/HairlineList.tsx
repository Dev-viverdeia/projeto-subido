import type { ReactNode } from 'react';
import styles from './HairlineList.module.css';

export interface HairlineListProps {
  items: ReactNode[];
  tone?: 'light' | 'dark';
  /**
   * `coluna` — um item por linha, separados por régua horizontal. É o padrão.
   * `fileira` — itens lado a lado a partir de 1024px, separados por régua VERTICAL.
   *   A direção da régua acompanha a do empilhamento: em fileira, a `border-top` de
   *   cada item viraria um traço solto sobre a primeira palavra.
   */
  direcao?: 'coluna' | 'fileira';
}

/**
 * Lista de fatos separada por hairline — sem bullet, sem ícone em círculo,
 * sem check verde. A régua fina é o separador, e ela é suficiente.
 *
 * É deliberadamente o oposto da lista de features com ícone colorido que toda
 * landing gerada usa: aqui a informação carrega o peso, não o ornamento.
 */
export function HairlineList({ items, tone = 'light', direcao = 'coluna' }: HairlineListProps) {
  return (
    <ul
      className={[styles.list, styles[tone], direcao === 'fileira' && styles.fileira]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((item, i) => (
        <li key={i} className={styles.item}>
          {item}
        </li>
      ))}
    </ul>
  );
}
