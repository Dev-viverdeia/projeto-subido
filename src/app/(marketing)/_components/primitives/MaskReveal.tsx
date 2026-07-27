import type { ElementType } from 'react';

export interface MaskRevealProps {
  /** Linhas AUTORAIS. Nós escolhemos onde quebra — é melhor tipografia do que
   *  deixar o navegador decidir, e é o que torna o device determinístico. */
  lines: ReadonlyArray<{ readonly text: string; readonly tone?: 'strong' | 'soft' }>;
  as?: ElementType;
  className?: string;
  /** `now` anima no mount (hero, acima da dobra). `scroll` espera o IntersectionObserver. */
  trigger?: 'now' | 'scroll';
  /** Deslocamento inicial do stagger, para encadear com o que veio antes. */
  offset?: number;
  id?: string;
  toneClass?: { strong?: string; soft?: string };
}

/**
 * Revelação por linha com máscara.
 *
 * É o device de maior impacto por custo da referência: cada linha vive numa janela
 * com `overflow: hidden` e sobe de baixo, escalonada. Custa zero JavaScript — no
 * hero é CSS puro disparado no mount, sem depender de biblioteca para o conteúdo
 * aparecer.
 *
 * O `padding-bottom` negativo compensado no CSS existe para que descendentes (g, j,
 * p, q) não sejam cortados pela janela — sem isso o device fica visivelmente errado
 * em português, que tem muito mais descendente que inglês.
 */
export function MaskReveal({
  lines,
  as: Tag = 'h2',
  className,
  trigger = 'scroll',
  offset = 0,
  id,
  toneClass,
}: MaskRevealProps) {
  return (
    <Tag
      id={id}
      className={['mask-reveal', trigger === 'now' && 'mask-reveal--now', className]
        .filter(Boolean)
        .join(' ')}
      data-reveal={trigger === 'scroll' ? '' : undefined}
    >
      {lines.map((line, i) => (
        <span key={i} className="mask-line" style={{ ['--line-i' as string]: i + offset }}>
          <span className={line.tone === 'soft' ? toneClass?.soft : toneClass?.strong}>
            {line.text}
          </span>
        </span>
      ))}
    </Tag>
  );
}
