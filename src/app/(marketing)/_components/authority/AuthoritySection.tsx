import Image from 'next/image';
import retratoPedro from '@/assets/img/pedro-sobral-recorte.png';
import { AUTHORITY } from '@/content/landing';
import { Section, SectionHeader, Reveal, RetratoFicticio } from '../primitives';
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
            {/* O PEDRO TEM FOTO DE VERDADE — a mesma do hero — e ela entra aqui.
                A outra pessoa não tem, e ganha retrato desenhado: rosto de banco na
                seção de autoridade seria pior que vazio, porque são justamente as
                pessoas que RESPONDEM pelo produto. `cover` e não `contain`: aqui a
                moldura 3:4 é o enquadramento, e sobra de fundo transparente dentro
                dela leria como recorte flutuando. */}
            <div className={styles.portrait}>
              {person.name === 'Pedro Sobral' ? (
                <Image
                  src={retratoPedro}
                  alt={person.name}
                  className={styles.photo}
                  sizes="(min-width: 900px) 320px, 45vw"
                />
              ) : (
                <RetratoFicticio nome={person.name} forma="retrato" />
              )}
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
