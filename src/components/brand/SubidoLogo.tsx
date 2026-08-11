import styles from './SubidoLogo.module.css';

export interface SubidoLogoProps {
  size?: number;
  className?: string;
  variant?: 'brand' | 'mono';
}

/** Marca principal do produto, baseada no lockup oficial da Subido. */
export function SubidoLogo({ size = 18, className, variant = 'brand' }: SubidoLogoProps) {
  return (
    <span
      className={[styles.logo, variant === 'mono' ? styles.mono : '', className]
        .filter(Boolean)
        .join(' ')}
      style={{ ['--subido-logo-size' as string]: `${size}px` }}
      role="img"
      aria-label="Subido"
    >
      <svg className={styles.simbolo} viewBox="0 0 64 64" aria-hidden="true">
        <path
          className={styles.balao}
          d="M21 4h25c8.3 0 14 5.9 14 14.5v23C60 50.1 54.1 56 45.5 56H26L10 64V20C10 10.7 14.5 4 21 4Z"
        />
        <path className={styles.seta} d="M21 20h27v27H38V34L26 46l-8-8 12-12h-9V20Z" />
      </svg>
      <span className={styles.wordmark}>subido</span>
    </span>
  );
}
