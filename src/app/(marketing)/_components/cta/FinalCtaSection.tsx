import { FINAL_CTA, HERO } from '@/content/landing';
import { MaskReveal } from '../primitives/MaskReveal';
import { Reveal } from '../primitives/Reveal';
import { TrackedCta } from '../primitives/TrackedCta';
import { SiteFooter } from './SiteFooter';
import styles from './FinalCtaSection.module.css';

/**
 * Banda escura 3 de 3 — fecha o ritmo que o hero abriu.
 *
 * Máscara por linha aqui também (e não como bloco): é o único outro lugar da página
 * que merece o mesmo device do hero, porque é o mesmo momento — pedir a decisão.
 */
export function FinalCtaSection() {
  return (
    <section className={`${styles.section} via-noise`} aria-labelledby="cta-final-title">
      <div className={styles.inner}>
        <MaskReveal
          as="h2"
          id="cta-final-title"
          className={`t-display ${styles.title}`}
          lines={FINAL_CTA.titleLines}
          toneClass={{ strong: styles.strong, soft: styles.soft }}
        />

        <Reveal index={1} className={styles.actions}>
          <TrackedCta href={FINAL_CTA.cta.href} local="final" className={styles.cta}>
            {FINAL_CTA.cta.label}
          </TrackedCta>
          <p className={styles.trust}>
            {HERO.trust.map((item, i) => (
              <span key={item}>
                {item}
                {i < HERO.trust.length - 1 ? <span className={styles.dot}>/</span> : null}
              </span>
            ))}
          </p>
        </Reveal>
      </div>

      <SiteFooter />
    </section>
  );
}
