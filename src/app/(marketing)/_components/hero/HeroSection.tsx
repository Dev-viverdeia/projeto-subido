import { HERO } from '@/content/landing';
import { CoBrandLockup } from '../chrome/CoBrandLockup';
import { MaskReveal } from '../primitives/MaskReveal';
import { Roll } from '../primitives/Roll';
import { HeroVideoFacade } from './HeroVideoFacade';
import styles from './HeroSection.module.css';

/**
 * Banda escura 1 de 3 — território da Comunidade Subido.
 *
 * PESO ZERO DE BIBLIOTECA. O mask reveal roda em CSS disparado no mount, os CTAs
 * são âncoras, e o único JS é o facade do vídeo. Toda a coreografia ligada a scroll
 * (e o Lenis) vive abaixo da dobra — é assim que dá para ter motion de estúdio sem
 * pagar com o LCP da página que recebe o clique pago.
 *
 * A composição é a de uma capa editorial: o título ocupa a largura toda e o resto
 * se organiza embaixo, em vez do split 56/44 genérico de SaaS que estava aqui antes.
 */
export function HeroSection() {
  return (
    <section className={`${styles.hero} via-mesh-navy via-noise`} aria-labelledby="hero-title">
      <div className={styles.inner}>
        <header className={styles.top}>
          <span className={`${styles.lockup} rise rise--now`} style={{ ['--rise-i' as string]: 0 }}>
            <CoBrandLockup size={18} />
          </span>
          <span
            className={`t-label t-label--sm ${styles.since} rise rise--now`}
            style={{ ['--rise-i' as string]: 1 }}
          >
            {HERO.since}
          </span>
        </header>

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

        <div className={styles.grid}>
          <div className={styles.lead}>
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
              <a href={HERO.ctaPrimary.href} className={styles.ctaPrimary}>
                <Roll>{HERO.ctaPrimary.label}</Roll>
              </a>
              <a href={HERO.ctaSecondary.href} className={styles.ctaSecondary}>
                <Roll>{HERO.ctaSecondary.label}</Roll>
              </a>
            </div>

            <p className={`${styles.trust} rise rise--now`} style={{ ['--rise-i' as string]: 7 }}>
              {/* O separador vem DEPOIS do item, não antes: quando a linha quebra,
                  ela começa com o rótulo em vez de com um "/" órfão. */}
              {HERO.trust.map((item, i) => (
                <span key={item}>
                  {item}
                  {i < HERO.trust.length - 1 ? <span className={styles.dot}>/</span> : null}
                </span>
              ))}
            </p>
          </div>

          <div className={`${styles.media} rise rise--now`} style={{ ['--rise-i' as string]: 6 }}>
            <HeroVideoFacade caption={HERO.videoCaption} />
          </div>
        </div>
      </div>

      <span className={styles.scrollHint} aria-hidden="true">
        {HERO.scrollHint}
      </span>
    </section>
  );
}
