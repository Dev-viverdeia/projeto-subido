import type { StaticImageData } from 'next/image';
import { TESTIMONIALS, TESTIMONIALS_META } from '@/content/landing';
import { Section, SectionHeader, Reveal, RetratoFicticio } from '../primitives';
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
/**
 * ONDE AS FOTOS REAIS ENTRAM. Chave = `name` do depoimento em content/landing.
 *
 * Está vazio de propósito, e o vazio é o estado correto até que existam fotos com
 * direito de uso das pessoas que de fato deram o depoimento. Enquanto uma chave não
 * existe aqui, o card cai na ilustração — que preenche a composição sem afirmar que
 * aquela pessoa existe.
 *
 * Para ligar uma foto, são duas linhas:
 *   import rafael from '@/assets/img/depoimento-rafael-nunes.jpg';
 *   const FOTOS = { 'Rafael Nunes': rafael };
 *
 * ESPECIFICAÇÃO DO ARQUIVO: quadrado (1:1), mínimo 224×224 para cobrir os 56px em
 * telas 2×, rosto centrado no terço superior (o `object-position` é `center top`),
 * JPG ou WebP — aqui não precisa de alfa, porque a moldura é que recorta.
 *
 * E O AVISO QUE IMPORTA: foto de banco de imagens ao lado de um nome, uma cidade e um
 * resultado inventados não é ilustração, é atribuição falsa — a pessoa da foto passa a
 * "ter dito" o depoimento. Se as fotos forem entrar, o caminho honesto é que venham
 * junto dos depoimentos REAIS, das mesmas pessoas.
 */
const FOTOS: Record<string, StaticImageData> = {};

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
              {/* RETRATO ILUSTRADO, não foto de banco: um rosto real que não é o do
                  depoente afirma que aquela pessoa disse aquilo. Ver RetratoFicticio.
                  56px e não 44: abaixo disso as feições viram três manchas e o desenho
                  lê como imagem corrompida em vez de ilustração. */}
              <span className={styles.avatar}>
                <RetratoFicticio nome={item.name} foto={FOTOS[item.name]} tamanho={56} />
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
