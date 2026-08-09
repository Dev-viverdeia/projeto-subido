import Link from 'next/link';
import { HERO, NAV, HEADER_LOGIN } from '@/content/landing';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { MaskReveal } from '../primitives/MaskReveal';
import { TrackedCta } from '../primitives/TrackedCta';
import { HeroPortrait } from './HeroPortrait';
import styles from './HeroSection.module.css';

/**
 * Banda escura 1 de 3 — a abertura.
 *
 * PESO ZERO DE BIBLIOTECA. O mask reveal roda em CSS disparado no mount, os CTAs são
 * âncoras, e o único JS é o facade do vídeo. Toda a coreografia ligada a scroll (e o
 * Lenis) vive abaixo da dobra — é assim que dá para ter motion de estúdio sem pagar
 * com o LCP da página que recebe o clique pago.
 *
 * COMPOSIÇÃO: duas colunas de verdade, não um título full-width com sobras embaixo.
 * O argumento inteiro (rótulo → título → lead → CTA → confiança) mora à esquerda, e a
 * direita carrega a figura. Isso resolve o vazio vertical que havia entre o título e a
 * linha de baixo, e dá ao hero a simetria de uma capa.
 */
export function HeroSection() {
  return (
    <section className={`${styles.hero} via-mesh-navy via-noise`} aria-labelledby="hero-title">
      <div className={styles.inner}>
        {/* Header estático: a mesma navegação da barra fixa, no estado de repouso.
            Transparente sobre o hero, tinta branca, hairline em gradiente que nasce
            e morre no nada — é o que separa uma régua de 1px de uma borda de caixa. */}
        <header className={`${styles.top} rise rise--now`} style={{ ['--rise-i' as string]: 0 }}>
          <span className={styles.logo}>
            <SubidoLogo size={19} variant="mono" />
          </span>

          <nav className={styles.nav} aria-label="Seções da página">
            {NAV.map((item) => (
              <a key={item.id} href={`#${item.id}`} className={styles.navLink}>
                {item.label}
              </a>
            ))}
          </nav>

          <Link href={HEADER_LOGIN.href} className={styles.login}>
            {HEADER_LOGIN.label}
          </Link>
        </header>

        <div className={styles.grid}>
          <div className={styles.copy}>
            {/* Linhas autorais: nós escolhemos a quebra. Dois tons SÓLIDOS fazem a
                hierarquia — nunca opacidade, nunca peso. */}
            <MaskReveal
              as="h1"
              id="hero-title"
              className={`t-hero ${styles.title}`}
              trigger="now"
              offset={1}
              lines={HERO.titleLines}
              toneClass={{ strong: styles.strong, soft: styles.soft }}
            />

            <p
              className={`t-lead ${styles.sub} rise rise--now`}
              style={{ ['--rise-i' as string]: 5 }}
            >
              {HERO.sub}
            </p>

            <div
              className={`${styles.actions} rise rise--now`}
              style={{ ['--rise-i' as string]: 6 }}
            >
              <TrackedCta href={HERO.ctaPrimary.href} local="hero" className={styles.ctaPrimary}>
                {HERO.ctaPrimary.label}
              </TrackedCta>
              <TrackedCta
                href={HERO.ctaSecondary.href}
                local="hero"
                className={styles.ctaSecondary}
              >
                {HERO.ctaSecondary.label}
              </TrackedCta>
            </div>

            {/* O separador vem DEPOIS do item, não antes: quando a linha quebra, ela
                começa com o rótulo em vez de com um "/" órfão. */}
            <p className={`${styles.trust} rise rise--now`} style={{ ['--rise-i' as string]: 7 }}>
              {HERO.trust.map((item, i) => (
                <span key={item}>
                  {item}
                  {i < HERO.trust.length - 1 ? <span className={styles.dot}>/</span> : null}
                </span>
              ))}
            </p>
          </div>

          {/* A ENTRADA MORA NO RETRATO, não neste contêiner, e a regra vale para quem
              vier depois: nada com `backdrop-filter` pode ter um ancestral que anime
              opacidade. Opacidade < 1 cria grupo composto, o filho passa a amostrar o
              grupo em vez da página, e o vidro não acontece — medido aqui no
              navegador, e é o mesmo motivo que faz a barra do SiteHeader entrar só por
              transform. Enquanto o `rise` viveu nesta div, o vidro que existia dentro
              dela ficava chapado durante ~1,02s (320ms de atraso + 700ms). */}
          <div className={styles.figure}>
            <div className={styles.figureInner}>
              <HeroPortrait
                alt={HERO.portraitAlt}
                prioritario
                className="rise rise--now"
                style={{ ['--rise-i' as string]: 4 }}
              />
            </div>
          </div>
        </div>
      </div>

      <span className={styles.scrollHint} aria-hidden="true">
        {HERO.scrollHint}
      </span>
    </section>
  );
}
