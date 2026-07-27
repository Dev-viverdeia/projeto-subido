import type { ReactNode } from 'react';
import styles from './DeviceFrame.module.css';

export interface DeviceFrameProps {
  children: ReactNode;
  tone?: 'light' | 'dark';
  /** Proporção do conteúdo. Sempre explícita — é o que segura o CLS. */
  ratio?: '16 / 10' | '16 / 9' | '4 / 3' | '3 / 4';
  className?: string;
}

/**
 * Moldura de produto.
 *
 * A landing mostra **produto real**, não ilustração vetorial de pessoas nem mockup
 * genérico — é uma das coisas que separa esta página de uma landing de template.
 * Enquanto os screenshots reais não existem, o conteúdo é um placeholder marcado,
 * mas a moldura já tem a proporção final para que a troca não mexa no layout.
 */
export function DeviceFrame({
  children,
  tone = 'light',
  ratio = '16 / 10',
  className,
}: DeviceFrameProps) {
  return (
    <div
      className={[styles.frame, styles[tone], className].filter(Boolean).join(' ')}
      style={{ aspectRatio: ratio }}
    >
      <div className={styles.screen}>{children}</div>
    </div>
  );
}
