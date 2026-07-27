import type { ReactNode } from 'react';
import styles from './legal.module.css';

/**
 * Casca das páginas legais.
 *
 * Elas existiam como links no rodapé apontando para 404 — o que numa página de venda
 * paga custa duas vezes: quebra a confiança de quem foi conferir as regras antes de
 * comprar, e o Google trata link interno morto como sinal de qualidade baixa.
 *
 * Estáticas e leves de propósito: são documentos, não interface.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main id="conteudo" className={styles.page}>
      <article className={styles.doc}>{children}</article>
    </main>
  );
}
