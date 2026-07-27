import { PATHS } from '@/content/landing';
import { Section, SectionHeader, Reveal } from '../primitives';
import styles from './TwoPathsSection.module.css';

/**
 * Segmentação em dois caminhos.
 *
 * A terceira linha — o DESQUALIFICADOR — é a peça que importa. Dizer para quem o
 * produto não é aumenta a qualidade do lead e derruba reembolso, e é a frase mais
 * VIA da página inteira: nenhuma landing de hype escreve isso.
 */
export function TwoPathsSection() {
  return (
    <Section id="caminhos" labelledBy="caminhos-title">
      <SectionHeader id="caminhos-title" eyebrow={PATHS.eyebrow} title={PATHS.title} />

      <div className={styles.grid}>
        {PATHS.options.map((option, i) => (
          <Reveal key={option.title} index={i} as="article" className={styles.card}>
            <span className={styles.index}>{String(i + 1).padStart(2, '0')}</span>
            <h3 className={`t-subtitle ${styles.cardTitle}`}>{option.title}</h3>
            <p className={styles.cardBody}>{option.body}</p>
          </Reveal>
        ))}
      </div>

      <Reveal index={2}>
        <p className={styles.disqualifier}>{PATHS.disqualifier}</p>
      </Reveal>
    </Section>
  );
}
