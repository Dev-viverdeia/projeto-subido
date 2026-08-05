import { Avatar } from '@/design-system/via';
import { AUTHORITY } from '@/content/landing';
import { Section, SectionHeader, Reveal } from '../primitives';
import styles from './AuthoritySection.module.css';

/**
 * Autoridade — quem responde pelo produto.
 *
 * As colunas têm largura e tratamento idênticos de propósito: o rosto conhecido e a
 * direção técnica pesam igual. Dar mais espaço ao rosto conhecido transformaria a
 * página num lançamento pessoal, e o que se vende aqui é a plataforma.
 *
 * O Sobral não aparece no hero de propósito — o topo pertence ao produto. Rosto dele
 * lá em cima faria disto um lançamento pessoal, e o posicionamento é o de produto:
 * a plataforma que ele constrói.
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
            {/* MONOGRAMA enquanto o retrato duotone não chega. Foto de banco aqui
                seria pior que vazio: são as duas pessoas que RESPONDEM pelo produto,
                e um rosto que não é o delas mina exatamente a credibilidade que a
                seção existe para construir. */}
            <div className={styles.portrait}>
              <Avatar alt={person.name} size="xl" />
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
