import { AUTHORITY } from '@/content/landing';
import { Section, SectionHeader, Reveal, AssetPlaceholder } from '../primitives';
import styles from './AuthoritySection.module.css';

/**
 * Autoridade — os dois lados com PESO IDÊNTICO.
 *
 * Mesma largura de coluna, mesmo tamanho de tipo, mesmo tratamento de retrato. A
 * gramática visual diz "joint venture", que é o que é: se um dos lados aparecesse
 * maior, a página viraria o lançamento de um deles com o outro de carona.
 *
 * O Sobral não aparece no hero de propósito — o topo pertence ao produto. Rosto dele
 * lá em cima faria disto "um lançamento do Sobral", e o posicionamento é o inverso:
 * uma plataforma do Viver de IA que ele avaliza.
 *
 * TODO(asset): retratos em duotone #02162A → #E4E7EC ASSADO NA EXPORTAÇÃO, nunca via
 * filter CSS — filter custa paint a cada frame e não cacheia.
 */
export function AuthoritySection() {
  return (
    <Section id="quem-faz" labelledBy="quem-faz-title">
      <SectionHeader id="quem-faz-title" eyebrow={AUTHORITY.eyebrow} title={AUTHORITY.title} />

      <div className={styles.grid}>
        {AUTHORITY.people.map((person, i) => (
          <Reveal key={person.name} index={i} as="article" className={styles.person}>
            <div className={styles.portrait}>
              <AssetPlaceholder label={`Retrato · ${person.name}`} spec="duotone assado · 3:4" />
            </div>

            <div className={styles.body}>
              <h3 className={`t-subtitle ${styles.name}`}>{person.name}</h3>
              <p className={styles.role}>{person.role}</p>

              <ul className={styles.credentials}>
                {person.credentials.map((credential) => (
                  <li key={credential}>{credential}</li>
                ))}
              </ul>

              <blockquote className={styles.quote}>
                <p>{person.quote}</p>
              </blockquote>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
