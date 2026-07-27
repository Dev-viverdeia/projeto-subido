import type { ReactNode } from 'react';
import styles from './Section.module.css';

/**
 * O ritmo de bandas da landing.
 *
 * A página alterna exatamente TRÊS momentos escuros (hero, HUB, CTA final) num corpo
 * claro. Isso não é decoração: banda escura é território da Comunidade Subido, corpo
 * editorial claro é território do Viver de IA. O próprio ritmo é o mecanismo de
 * co-branding — vale mais do que repetir um lockup em toda seção.
 *
 * Landing genérica alterna fundo mecanicamente e usa seções todas do mesmo tamanho.
 * Aqui o tom e a largura são escolhas por seção, e é isso que faz a página respirar.
 */
export type SectionTone = 'light' | 'tint' | 'navy' | 'navy-deep';

/** `content` (760px) é para prosa; `narrow` (560px) para blocos de uma ideia só. */
export type SectionWidth = 'container' | 'content' | 'narrow' | 'full';

export interface SectionProps {
  children: ReactNode;
  /** Âncora do menu. */
  id?: string;
  tone?: SectionTone;
  width?: SectionWidth;
  /** `tight` para faixas de apoio, `loose` para os atos principais. */
  space?: 'tight' | 'base' | 'loose';
  /** Torna a seção um marco de leitura para leitores de tela. */
  labelledBy?: string;
  className?: string;
}

// CSS Modules são tipados como index signature, então cada acesso é `string | undefined`
// sob noUncheckedIndexedAccess. O `.filter(Boolean)` abaixo absorve isso.
const toneClass: Record<SectionTone, Array<string | undefined>> = {
  light: [styles.light],
  tint: [styles.tint],
  navy: [styles.navy, 'via-mesh-navy', 'via-noise'],
  'navy-deep': [styles.navyDeep, 'via-noise'],
};

export function Section({
  children,
  id,
  tone = 'light',
  width = 'container',
  space = 'base',
  labelledBy,
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={[styles.section, ...toneClass[tone], styles[space], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={[styles.inner, styles[width]].filter(Boolean).join(' ')}>{children}</div>
    </section>
  );
}
