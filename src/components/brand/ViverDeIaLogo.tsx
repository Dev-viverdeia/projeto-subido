import Image from 'next/image';
import styles from './ViverDeIaLogo.module.css';

type Props = {
  className?: string;
  size?: 'compact' | 'default' | 'large';
  variant?: 'navy' | 'white';
  produto?: boolean;
};

const MEDIDAS = {
  compact: { mark: 18, word: 13 },
  default: { mark: 25, word: 18 },
  large: { mark: 34, word: 24 },
} as const;

/** Lockup oficial VIA. O rótulo Subido identifica a colaboração sem redesenhar a marca. */
export function ViverDeIaLogo({
  className,
  size = 'default',
  variant = 'navy',
  produto = true,
}: Props) {
  const medida = MEDIDAS[size];
  const claro = variant === 'white';

  return (
    <span
      className={[styles.logo, claro ? styles.white : '', className].filter(Boolean).join(' ')}
      style={{
        ['--via-logo-mark' as string]: `${medida.mark}px`,
        ['--via-logo-word' as string]: `${medida.word}px`,
      }}
      role="img"
      aria-label="Viver de IA Subido"
    >
      <Image
        src={`/brand/via/monogram-${claro ? 'white' : 'navy'}.png`}
        width={434}
        height={239}
        alt=""
        className={styles.monograma}
        priority
      />
      <Image
        src={`/brand/via/wordmark-${claro ? 'white' : 'navy'}.png`}
        width={373}
        height={31}
        alt=""
        className={styles.wordmark}
        priority
      />
      {produto && <span className={styles.produto}>Subido</span>}
    </span>
  );
}
