'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';

export interface RevealProps {
  children: ReactNode;
  /** Posição na sequência de stagger. Efeito limitado a 5 passos (300ms). */
  index?: number;
  /** Elemento renderizado. `div` por padrão; use `li`, `article`, etc. quando fizer sentido. */
  as?: ElementType;
  className?: string;
  /**
   * `rise` (padrão) sobe e revela o próprio bloco.
   * `trigger` não anima nada por si: só marca `data-revealed` quando entra em tela,
   * para que os filhos (ex.: as linhas de um MaskReveal) façam a própria animação.
   * Sem isso, envolver um MaskReveal num Reveal faria os dois animarem ao mesmo
   * tempo — o bloco inteiro em fade e as linhas em máscara, um por cima do outro.
   */
  mode?: 'rise' | 'trigger';
}

/**
 * O único primitivo de motion da landing.
 *
 * Não existe biblioteca de animação neste projeto: todo o vocabulário da página é
 * reveal na entrada, hover-lift, dois count-ups, uma marquee e uma digitação.
 * `framer-motion` custaria 35–50 kB gz na página LCP-crítica de um funil pago para
 * entregar isso. Aqui são ~40 linhas e um IntersectionObserver.
 *
 * Também não há nenhum listener de `scroll` nesta página — é o que protege o INP.
 */
export function Reveal({
  children,
  index = 0,
  as: Tag = 'div',
  className,
  mode = 'rise',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Se a classe não está no <html>, motion está desligado: nada a fazer, e o
    // conteúdo já está visível.
    if (!document.documentElement.classList.contains('js-reveal')) return;

    const onEnd = () => el.removeAttribute('data-animating');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          el.setAttribute('data-animating', '');
          el.setAttribute('data-revealed', '');
          el.addEventListener('transitionend', onEnd, { once: true });
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      el.removeEventListener('transitionend', onEnd);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      // `data-reveal` marca a sentinela e não pinta nada. O visual vem da classe
      // `.rise` — é essa separação que deixa um elemento ser sentinela e ter a
      // própria animação (uma máscara, por exemplo) sem as duas brigarem.
      data-reveal=""
      className={[mode === 'rise' && 'rise', className].filter(Boolean).join(' ')}
      style={index ? ({ '--reveal-i': index } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
