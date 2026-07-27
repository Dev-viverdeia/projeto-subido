'use client';

import { useEffect, useRef, useState } from 'react';

export interface CountUpProps {
  /** Valor já formatado, ex.: "+50 mil", "103", "+R$ 400 mi", "[N]". */
  value: string;
  className?: string;
}

/** Extrai o primeiro número do rótulo, preservando prefixo e sufixo. */
function parse(value: string) {
  const match = /(\d[\d.,]*)/.exec(value);
  if (!match || match.index === undefined) return null;
  const raw = match[1] ?? '';
  const digits = Number(raw.replace(/[.,]/g, ''));
  if (!Number.isFinite(digits)) return null;
  return {
    prefix: value.slice(0, match.index),
    suffix: value.slice(match.index + raw.length),
    target: digits,
    /** Reproduz o agrupamento original (400 vs 50) na hora de formatar. */
    grouped: /[.,]/.test(raw),
  };
}

/**
 * Contagem crescente ao entrar em tela.
 *
 * Números são a prova desta página, e vê-los subir é o que os transforma de rótulo em
 * evento. Vale só quando há número: valores como "[N]" ou "8 anos" que ainda são
 * placeholder caem no caminho estático, sem piscar.
 *
 * Sem biblioteca: um `requestAnimationFrame` com ease-out cúbico. O SSR já entrega o
 * valor FINAL — se o JS não rodar, o número correto está lá; a animação só substitui
 * um valor que já existe, nunca revela um que faltava.
 */
export function CountUp({ value, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    const parsed = parse(value);
    if (!el || !parsed) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const format = (n: number) => (parsed.grouped ? n.toLocaleString('pt-BR') : String(n));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(el);

          const duration = 900;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(
              `${parsed.prefix}${format(Math.round(parsed.target * eased))}${parsed.suffix}`,
            );
            if (t < 1) frame = requestAnimationFrame(tick);
          };
          setDisplay(`${parsed.prefix}${format(0)}${parsed.suffix}`);
          frame = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
