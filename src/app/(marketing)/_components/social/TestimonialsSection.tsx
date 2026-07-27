import { TESTIMONIALS, TESTIMONIALS_META } from '@/content/landing';
import { Section, SectionHeader, Reveal, AssetPlaceholder } from '../primitives';
import styles from './TestimonialsSection.module.css';

/**
 * Prova social.
 *
 * REGRA INEGOCIÁVEL quando os reais entrarem: todo card carrega nome, foto, cidade
 * ou segmento, prazo e resultado concreto. Depoimento sem número é decoração — corta.
 *
 * E o depoimento NUNCA é reescrito para a voz da marca: fica verbatim, no português
 * do aluno, gíria e erro de grafia inclusos. A voz autoral da página é VIA; a voz
 * citada é do aluno. Uniformizar as duas mata os dois registros — a energia que a
 * audiência do Sobral reconhece só existe como evidência, não como postura autoral.
 */
export function TestimonialsSection() {
  return (
    <Section id="resultados" tone="tint" labelledBy="resultados-title">
      <SectionHeader
        id="resultados-title"
        eyebrow={TESTIMONIALS_META.eyebrow}
        title={TESTIMONIALS_META.title}
      />

      <ul className={styles.grid}>
        {TESTIMONIALS.map((item, i) => (
          <Reveal key={i} as="li" index={i} className={styles.card}>
            <blockquote className={styles.quote}>
              <p className={styles.quoteText}>{item.quote}</p>
            </blockquote>

            <div className={styles.outcome}>
              <span className={styles.outcomeValue}>{item.outcome}</span>
              <span className={styles.outcomeTime}>{item.timeframe}</span>
            </div>

            <footer className={styles.person}>
              <span className={styles.avatar}>
                <AssetPlaceholder label="foto" />
              </span>
              <span className={styles.identity}>
                <span className={styles.name}>{item.name}</span>
                <span className={styles.role}>
                  {item.role} · {item.city}
                </span>
              </span>
            </footer>
          </Reveal>
        ))}
      </ul>

      <p className={styles.note}>{TESTIMONIALS_META.note}</p>
    </Section>
  );
}
