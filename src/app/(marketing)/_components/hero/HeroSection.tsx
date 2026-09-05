import Link from 'next/link';
import { HERO, NAV, HEADER_LOGIN } from '@/content/landing';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { TrackedCta } from '../primitives/TrackedCta';
import { HeroPortrait } from './HeroPortrait';
import styles from './HeroSection.module.css';

/**
 * Banda escura 1 de 3 — a abertura.
 *
 * Conteúdo da primeira dobra visível no HTML, sem cascata de entrada. A auditoria
 * mobile encontrou 1,76 s de atraso de renderização no lead, que participava do
 * reveal com índice 6. Título, argumento e ações não esperam animação ou hidratação.
 * As interações e os reveals das seções seguintes continuam independentes.
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
        <header className={styles.top}>
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
            <p className={styles.eyebrow}>{HERO.eyebrow}</p>

            {/* Linhas autorais: nós escolhemos a quebra. Dois tons SÓLIDOS fazem a
                hierarquia — nunca opacidade, nunca peso. */}
            <h1 id="hero-title" className={`t-hero ${styles.title}`}>
              {HERO.titleLines.map((line) => (
                <span
                  key={line.text}
                  className={line.tone === 'soft' ? styles.soft : styles.strong}
                >
                  {line.text}
                </span>
              ))}
            </h1>

            <p className={`t-lead ${styles.sub}`}>{HERO.sub}</p>

            <div className={styles.actions}>
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
            <p className={styles.trust}>
              {HERO.trust.map((item, i) => (
                <span key={item}>
                  {item}
                  {i < HERO.trust.length - 1 ? <span className={styles.dot}>/</span> : null}
                </span>
              ))}
            </p>
          </div>

          <div className={styles.figure}>
            <div className={styles.figureInner}>
              <HeroPortrait alt={HERO.portraitAlt} prioritario />
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
