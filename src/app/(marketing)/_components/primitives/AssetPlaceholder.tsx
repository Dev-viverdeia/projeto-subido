import styles from './AssetPlaceholder.module.css';

export interface AssetPlaceholderProps {
  /** O que precisa ser produzido. Aparece na tela — é para ser visto, não escondido. */
  label: string;
  /** Dimensão-alvo do asset real, para quem for produzir. */
  spec?: string;
  tone?: 'light' | 'dark';
}

/**
 * Nenhum asset da landing existe ainda (VSL, retratos, screenshots dos pilares).
 *
 * A escolha aqui é deliberada: em vez de imagem de banco ou silhueta genérica — que
 * passa despercebida e acaba indo para produção — o placeholder é visivelmente um
 * placeholder e diz o que falta. Layout, proporção e peso visual já são os finais,
 * então trocar pelo asset real não mexe em nada.
 *
 * A lista completa do que produzir está na task "Produzir assets de marca".
 */
export function AssetPlaceholder({ label, spec, tone = 'light' }: AssetPlaceholderProps) {
  return (
    <div
      className={[styles.box, styles[tone]].join(' ')}
      role="img"
      aria-label={`Placeholder: ${label}`}
    >
      <span className={styles.label}>{label}</span>
      {spec ? <span className={styles.spec}>{spec}</span> : null}
    </div>
  );
}
