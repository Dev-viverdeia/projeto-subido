import type { ReactNode } from 'react';
import styles from './formulario.module.css';

/** Título + linha de apoio das telas de auth. Server Component — custa zero JS. */
export function Cabecalho({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <header className={styles.cabecalho}>
      <h1 className={styles.titulo}>{titulo}</h1>
      {children && <p className={styles.subtitulo}>{children}</p>}
    </header>
  );
}
