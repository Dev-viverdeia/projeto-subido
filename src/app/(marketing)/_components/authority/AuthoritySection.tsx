import Image from 'next/image';
import retratoPedro from '@/assets/img/pedro-sobral-recorte.png';
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
            {/* MOLDURA SÓ PARA QUEM TEM FOTO DE VERDADE. O retrato desenhado saiu
                daqui: numa moldura 3:4 de 140×187 ele virava um campo de cor com duas
                letras, que preenche espaço sem informar nada — e numa seção cujo
                trabalho é dizer QUEM responde pelo produto, um símbolo abstrato do
                tamanho de um rosto lê como foto que não carregou.
                Sem moldura, o card fica tipográfico e a credencial assume o peso, que
                é o mesmo caminho que o CartaoSolucao já usa na área logada.
                `cover` e não `contain` no Pedro: aqui a moldura É o enquadramento, e
                fundo transparente sobrando dentro dela leria como adesivo. */}
            {person.name === 'Pedro Sobral' && (
              <div className={styles.portrait}>
                <Image
                  src={retratoPedro}
                  alt={person.name}
                  className={styles.photo}
                  sizes="(min-width: 900px) 320px, 45vw"
                />
              </div>
            )}

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
