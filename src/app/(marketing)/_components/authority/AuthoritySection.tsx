import Image from 'next/image';
import retratoPedro from '@/assets/img/pedro-sobral-recorte.png';
import { AUTHORITY } from '@/content/landing';
import { Section, SectionHeader, Reveal } from '../primitives';
import styles from './AuthoritySection.module.css';

/**
 * Autoridade — quem responde pelo produto.
 *
 * HOJE A SEÇÃO TEM UMA PESSOA SÓ, e isso muda o argumento dela. O desenho original
 * eram duas colunas de largura e tratamento idênticos, porque "o rosto conhecido e a
 * direção técnica pesam igual" — a paridade era a mensagem, e existia para a página
 * não virar lançamento pessoal. Com uma coluna, a seção passa a dizer "este produto é
 * do Pedro". Quando a direção técnica voltar, ela volta em coluna de peso idêntico.
 *
 * E O SOBRAL PASSOU A APARECER NO HERO. O texto anterior daqui dizia o contrário —
 * "o topo pertence ao produto, rosto dele lá em cima faria disto um lançamento
 * pessoal". Foi uma decisão deliberada, e ela foi revertida a pedido: o retrato dele
 * é hoje a figura do hero. Fica registrado que é uma reversão consciente, não um
 * descuido, porque é o tipo de coisa que ninguém lembra de ter decidido três meses
 * depois.
 *
 * TODO(asset): retrato em duotone #02162A → #E4E7EC ASSADO NA EXPORTAÇÃO, nunca via
 * filter CSS — filter custa paint a cada frame e não cacheia. Hoje entra o mesmo
 * recorte do hero, sem tratamento.
 */
export function AuthoritySection() {
  return (
    <Section id="quem-faz" labelledBy="quem-faz-title">
      <SectionHeader id="quem-faz-title" eyebrow={AUTHORITY.eyebrow} title={AUTHORITY.title} />

      <div className={styles.grid}>
        {AUTHORITY.people.map((person, i) => (
          <Reveal key={person.name} index={i} as="article" className={styles.person}>
            {/* `cover` e não `contain`: aqui a moldura 3:4 É o enquadramento, e fundo
                transparente sobrando dentro dela leria como adesivo em vez de retrato.
                Quem entrar nesta seção sem foto NÃO ganha retrato desenhado — na
                moldura de 140×187 ele vira um campo de cor com duas letras, que numa
                seção cujo trabalho é dizer quem responde pelo produto lê como foto
                que não carregou. Sem moldura, o card fica tipográfico. */}
            <div className={styles.portrait}>
              <Image
                src={retratoPedro}
                alt={person.name}
                className={styles.photo}
                sizes="(min-width: 900px) 320px, 45vw"
              />
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
