'use client';

import { useEffect } from 'react';

/**
 * Smooth scroll (Lenis).
 *
 * De todas as coisas que separam uma landing "boa" de uma que parece cara, esta é a
 * de maior razão impacto/custo: ~3 KB gz que mudam a sensação da página inteira.
 * A rolagem nativa é seca; a interpolada faz cada seção parecer deliberada.
 *
 * DISCIPLINA DE CARGA
 * O import é dinâmico e roda dentro de um `useEffect`, então o Lenis não entra no
 * bundle inicial e não toca o caminho crítico do LCP. O hero é CSS puro; se este
 * módulo nunca carregar, a página continua perfeitamente utilizável — só com
 * rolagem nativa.
 *
 * ACESSIBILIDADE
 * Desligado sob `prefers-reduced-motion`. Rolagem interpolada é justamente o tipo
 * de movimento que causa desconforto vestibular, e sequestrar o scroll de quem
 * pediu para não ter movimento seria o pior erro possível.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let frame = 0;
    let cancelled = false;

    void import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({
        // Curva longa e com fim macio: é o que dá a sensação de peso.
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        // Toque continua nativo — interpolar scroll no mobile atrapalha mais do que ajuda.
        smoothWheel: true,
        touchMultiplier: 1.6,

        /**
         * OBRIGATÓRIO, e a omissão é silenciosa.
         *
         * Ao assumir o scroll, o Lenis passa a manter a própria posição virtual. O
         * salto nativo de hash deixa de mover a página: o `location.hash` muda, a URL
         * muda, e o scroll não sai do lugar. Sem esta opção TODAS as âncoras da
         * landing quebram — header, CTAs do hero, índice dos pilares, botão de preço —
         * e sem nenhum erro no console.
         *
         * `true` e não um offset próprio: o Lenis já respeita o `scroll-padding-top`
         * do <html> (88px, definido em globals.css). Passar offset aqui somava as duas
         * compensações e as seções paravam a 176px do topo — 88px de vão fantasma.
         * Um único lugar define a folga, e ele serve tanto ao Lenis quanto ao salto
         * nativo de quem tem reduced-motion.
         */
        anchors: true,
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, []);

  return null;
}
