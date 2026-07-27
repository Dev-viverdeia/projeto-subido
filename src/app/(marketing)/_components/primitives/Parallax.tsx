'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';

export interface ParallaxProps {
  children: ReactNode;
  /** Deslocamento total em px ao longo da travessia. Negativo sobe. */
  distance?: number;
  className?: string;
}

/**
 * Deslocamento vinculado ao scroll.
 *
 * É o device que faz uma seção parecer ter profundidade em vez de ser um bloco
 * estático: a mídia anda mais devagar que o texto ao lado, então a coluna toda ganha
 * um eixo Z implícito.
 *
 * `useScroll` do Motion usa o scroll timeline internamente — não há listener de
 * `scroll` no código, que é o que protege o INP. E o range é a travessia do elemento
 * pela viewport (`start end` → `end start`), não a página inteira, então o efeito é
 * local e previsível.
 *
 * Só `transform` é animado. Sob `prefers-reduced-motion` o deslocamento é zero.
 */
export function Parallax({ children, distance = -56, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : distance]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y, willChange: 'transform' }}>{children}</motion.div>
    </div>
  );
}
