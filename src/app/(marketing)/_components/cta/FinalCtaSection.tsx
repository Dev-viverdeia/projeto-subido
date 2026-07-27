import { FINAL_CTA, HERO } from '@/content/landing';
import { CoBrandLockup } from '@/components/brand/CoBrandLockup';
import { MaskReveal } from '../primitives/MaskReveal';
import { Roll } from '../primitives/Roll';
import { Reveal } from '../primitives/Reveal';
import styles from './FinalCtaSection.module.css';

/**
 * Banda escura 3 de 3 — fecha o ritmo que o hero abriu.
 *
 * Máscara por linha aqui também (e não como bloco): é o único outro lugar da página
 * que merece o mesmo device do hero, porque é o mesmo momento — pedir a decisão.
 */
export function FinalCtaSection() {
  const year = 2026;

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
          <a href={FINAL_CTA.cta.href} className={styles.cta}>
            <Roll>{FINAL_CTA.cta.label}</Roll>
          </a>
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

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.brand}>
            <CoBrandLockup size={16} />
            <p className={styles.partnership}>Viver de IA e Comunidade Subido — parceria</p>
          </div>

          <nav className={styles.links} aria-label="Rodapé">
            <a href="/termos" className="ul-grow">
              Termos de uso
            </a>
            <a href="/privacidade" className="ul-grow">
              Privacidade
            </a>
            <a href="/reembolso" className="ul-grow">
              Política de reembolso
            </a>
          </nav>

          <p className={styles.legal}>
            {/* TODO(legal): CNPJ, razão social e endereço da entidade que emite a nota. */}
            TODO(legal) · CNPJ · endereço · © {year}
          </p>
        </div>
      </footer>
    </section>
  );
}
