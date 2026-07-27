'use client';

import { useEffect, useRef, useState } from 'react';
import { NAV, HEADER_CTA } from '@/content/landing';
import { CoBrandLockup } from '@/components/brand/CoBrandLockup';
import { Roll } from '../primitives/Roll';
import styles from './SiteHeader.module.css';

/**
 * Barra fixa que entra depois do hero.
 *
 * TRÊS DECISÕES QUE IMPORTAM:
 *
 * 1. SEM LISTENER DE SCROLL. O gatilho é um IntersectionObserver sobre uma sentinela
 *    de 1px logo abaixo do hero. Um `scroll` listener roda a cada frame de rolagem e
 *    é a forma mais comum de estourar o INP numa página longa.
 *
 * 2. SCROLL-SPY. Saber ONDE se está é metade da usabilidade de uma barra de âncoras.
 *    Um segundo observer marca a seção que cruza a faixa central da viewport e o item
 *    correspondente recebe `aria-current="location"` — não é só estilo, é anunciado.
 *
 * 3. ESCONDIDA ≠ INEXISTENTE. Uma barra apenas transladada para fora continua no
 *    fluxo de tabulação: quem navega por teclado cai dentro de uma UI invisível e
 *    fica preso. Por isso ela recebe `inert` e `visibility: hidden` enquanto oculta.
 */
export function SiteHeader() {
  const sentinel = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  // 1 · Aparecer depois do hero
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        // A sentinela cobre a altura do hero (ver o CSS): "intersectando" significa
        // que ainda há hero em tela. Como não se rola acima de zero, sair da
        // interseção só pode significar "passou do hero" — não é preciso testar sinal
        // de coordenada, e o estado é sempre o atual.
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2 · Scroll-spy
  useEffect(() => {
    const sections = NAV.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    // O observer só relata QUEM MUDOU, então o estado atual precisa ser acumulado —
    // sem isso, uma seção que continua na faixa some do cálculo no próximo callback.
    const naFaixa = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) naFaixa.add(entry.target.id);
          else naFaixa.delete(entry.target.id);
        }
        // Ordem do documento decide o empate quando duas seções cruzam a faixa.
        const atual = NAV.find((item) => naFaixa.has(item.id));
        // LIMPA quando nada do menu está na faixa. A landing tem seções fora do nav
        // (planos, comparação, quem faz); manter o último item aceso nelas faria a
        // barra afirmar uma posição errada, que é pior do que não afirmar nenhuma.
        setActive(atual?.id ?? null);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} className={styles.sentinel} aria-hidden="true" />

      <header className={styles.header} data-visible={visible ? '' : undefined} inert={!visible}>
        <div className={styles.inner}>
          <a href="#conteudo" className={styles.brand} aria-label="Início">
            <CoBrandLockup size={15} />
          </a>

          <nav className={styles.nav} aria-label="Seções da página">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={styles.link}
                aria-current={active === item.id ? 'location' : undefined}
              >
                <Roll>{item.label}</Roll>
              </a>
            ))}
          </nav>

          <a href={HEADER_CTA.href} className={styles.cta}>
            <Roll>{HEADER_CTA.label}</Roll>
          </a>
        </div>
      </header>
    </>
  );
}
