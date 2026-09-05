import type { CSSProperties, ReactNode } from 'react';
import styles from './Parallax.module.css';

export interface ParallaxProps {
  children: ReactNode;
  /** Deslocamento total em px ao longo da travessia. Negativo sobe. */
  distance?: number;
  className?: string;
}

/**
 * Profundidade progressiva, sem baixar uma biblioteca na abertura da landing.
 * A timeline acompanha o contêiner estável, não a mídia que se desloca.
 * Sem suporte ou com movimento reduzido, a mídia permanece estática e visível.
 */
export function Parallax({ children, distance = -56, className }: ParallaxProps) {
  return (
    <div className={[styles.track, className].filter(Boolean).join(' ')}>
      <div
        className={styles.media}
        style={{ '--parallax-distance': `${distance}px` } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
