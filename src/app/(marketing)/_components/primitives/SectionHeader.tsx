import type { ReactNode } from 'react';
import { Reveal } from './Reveal';
import styles from './SectionHeader.module.css';

export interface SectionHeaderProps {
  /** Rótulo curto em mono. Nunca uma frase — os parênteses vêm do CSS. */
  eyebrow?: string;
  /** Aceita <em>: a ênfase é itálico editorial, nunca peso 700. */
  title: ReactNode;
  sub?: ReactNode;
  /** Precisa bater com o `labelledBy` da Section para o marco de leitura funcionar. */
  id?: string;
  align?: 'start' | 'center';
  tone?: 'light' | 'dark';
  /**
   * Escolhido pelo CONTEXTO, não pela hierarquia:
   *   display → cabeçalho ocupando a largura total da seção
   *   title   → cabeçalho dentro de uma coluna (metade da grade)
   *   subtitle→ sub-bloco
   */
  size?: 'display' | 'title' | 'subtitle';
  wide?: boolean;
}

/**
 * O cabeçalho já se revela sozinho — quem usa não precisa envolver em <Reveal>.
 *
 * O título sobe de dentro de uma máscara como bloco único. Máscara por linha exigiria
 * quebras autorais (como no hero), o que não vale para 15 seções; como bloco, o device
 * entrega a mesma sensação de "o texto vem de trás de uma régua" sem obrigar a
 * escrever cada quebra à mão.
 */
export function SectionHeader({
  eyebrow,
  title,
  sub,
  id,
  align = 'start',
  tone = 'light',
  size = 'display',
  wide = false,
}: SectionHeaderProps) {
  return (
    <header
      className={[
        styles.header,
        wide && styles['header--wide'],
        align === 'center' && styles.center,
        styles[tone],
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {eyebrow ? (
        <Reveal className={styles.eyebrow}>
          <span className="t-label">{eyebrow}</span>
          <span className={styles.rule} aria-hidden="true" />
        </Reveal>
      ) : null}

      <Reveal as="h2" mode="trigger" className={`t-${size} ${styles.title}`}>
        <span className="mask-line">
          <span id={id}>{title}</span>
        </span>
      </Reveal>

      {sub ? (
        <Reveal index={1}>
          <p className={`t-lead ${styles.sub}`}>{sub}</p>
        </Reveal>
      ) : null}
    </header>
  );
}
