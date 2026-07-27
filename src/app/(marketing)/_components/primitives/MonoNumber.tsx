import styles from './MonoNumber.module.css';

export interface MonoNumberProps {
  /** Ex.: "+50 mil", "103", "+R$ 400 mi". Já formatado — este componente não formata. */
  value: string;
  size?: 'lg' | 'md' | 'sm';
  tone?: 'light' | 'dark';
}

/**
 * Números são a prova desta página, então recebem tratamento de protagonista:
 * Geist Mono, tabular, navy sólido.
 *
 * `tabular-nums` + `min-width` em `ch` não são detalhe: sem eles, um count-up
 * reflui o layout a cada frame e o CLS estoura justamente na seção de credibilidade.
 */
export function MonoNumber({ value, size = 'lg', tone = 'light' }: MonoNumberProps) {
  return (
    <span
      className={[styles.number, styles[size], styles[tone]].join(' ')}
      style={{ minWidth: `${value.length}ch` }}
    >
      {value}
    </span>
  );
}
