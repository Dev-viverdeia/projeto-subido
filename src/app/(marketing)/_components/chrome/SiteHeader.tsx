'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { NAV, HEADER_CTA, HEADER_LOGIN } from '@/content/landing';
import { SubidoLogo } from './SubidoLogo';
import { TrackedCta } from '../primitives/TrackedCta';
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
      () => {
        // DUAS defesas, porque cada uma cobre uma falha diferente:
        //
        //  · a sentinela COBRE a altura do hero (ver o CSS) — sem isso, um salto de
        //    âncora que pula de "abaixo da viewport" para "acima" não muda o estado
        //    de interseção e o observer nunca dispara;
        //  · a geometria é lida AO VIVO e o `entry` é ignorado — `boundingClientRect`
        //    é um retrato de quando a observação foi enfileirada, e num salto longo
        //    chega desatualizado, escondendo a barra logo após navegar pelo menu.
        //
        // `bottom <= 0` = a sentinela inteira já passou por cima: saímos do hero.
        setVisible(el.getBoundingClientRect().bottom <= 0);
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

      <header className={styles.wrap} data-visible={visible ? '' : undefined} inert={!visible}>
        <div className={styles.bar}>
          <a href="#conteudo" className={styles.brand} aria-label="Início">
            <SubidoLogo size={17} />
          </a>

          <nav className={styles.nav} aria-label="Seções da página">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={styles.link}
                aria-current={active === item.id ? 'location' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className={styles.acoes}>
            <Link href={HEADER_LOGIN.href} className={styles.login}>
              {HEADER_LOGIN.label}
            </Link>

            <TrackedCta href={HEADER_CTA.href} local="header" className={styles.cta}>
              {HEADER_CTA.label}
              <ArrowUpRight size={15} strokeWidth={2.2} className={styles.ctaArrow} aria-hidden />
            </TrackedCta>
          </div>
        </div>
      </header>
    </>
  );
}
