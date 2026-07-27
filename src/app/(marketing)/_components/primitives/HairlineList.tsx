import type { ReactNode } from 'react';
import styles from './HairlineList.module.css';

export interface HairlineListProps {
  items: ReactNode[];
  tone?: 'light' | 'dark';
}

/**
 * Lista de fatos separada por hairline — sem bullet, sem ícone em círculo,
 * sem check verde. A régua fina é o separador, e ela é suficiente.
 *
 * É deliberadamente o oposto da lista de features com ícone colorido que toda
 * landing gerada usa: aqui a informação carrega o peso, não o ornamento.
 */
export function HairlineList({ items, tone = 'light' }: HairlineListProps) {
  return (
    <ul className={[styles.list, styles[tone]].join(' ')}>
      {items.map((item, i) => (
        <li key={i} className={styles.item}>
          {item}
        </li>
      ))}
    </ul>
  );
}
