import { PROOF, PROOF_NOTE } from '@/content/landing';
import { Section, Reveal } from '../primitives';
import { CountUp } from './CountUp';
import styles from './CredibilityStrip.module.css';

/**
 * Quem está por trás, respondido antes que a dúvida se forme.
 *
 * Os dois blocos têm peso visual IDÊNTICO — mesma largura, mesmo tamanho de número.
 * A gramática visual diz "joint venture", que é o que é; se um dos lados aparecesse
 * maior, a página passaria a ser o lançamento de um deles com o outro de carona.
 *
 * A nota de fonte no rodapé da seção não é jurídiquês: num mercado de números
 * inflados, dizer de onde vem o número é o elemento mais credível da página inteira.
 */
export function CredibilityStrip() {
  return (
    <Section tone="tint" space="tight">
      <div className={styles.groups}>
        {PROOF.map((group, gi) => (
          <Reveal key={group.source} index={gi} className={styles.group}>
            <p className={styles.source}>{group.source}</p>
            <dl className={styles.stats}>
              {group.stats.map((stat) => (
                <div key={stat.label} className={styles.stat}>
                  <dt className={styles.value}>
                    <CountUp value={stat.value} />
                  </dt>
                  <dd className={styles.label}>{stat.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        ))}
      </div>
      <p className={styles.note}>{PROOF_NOTE}</p>
    </Section>
  );
}
