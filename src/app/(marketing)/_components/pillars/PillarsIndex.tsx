import { ArrowDown } from 'lucide-react';
import { PILLARS } from '@/content/landing';
import { Section, SectionHeader, Reveal } from '../primitives';
import styles from './PillarsIndex.module.css';

/**
 * Índice dos quatro pilares. Zero JavaScript.
 *
 * Aqui não há abas de propósito, por quatro razões em ordem de peso:
 *
 *  1. O pitch é VOLUME. "Você recebe quatro coisas" se comunica com quatro batidas de
 *     scroll. Um widget de abas comunica UMA coisa com três irmãs escondidas — ele
 *     subvende a oferta ativamente.
 *  2. Comportamento mobile de tráfego pago é scroll rápido, não exploração: quem
 *     escaneia veria 25% do produto.
 *  3. Custo de INP e de bundle na região mais importante da página.
 *  4. Texto visível ranqueia; painel `hidden` não.
 *
 * Este índice recupera o único benefício real que as abas teriam — a visão geral de
 * relance — e recupera de graça.
 */
export function PillarsIndex() {
  return (
    <Section id="pilares" tone="light" labelledBy="pilares-title">
      <Reveal>
        <SectionHeader
          id="pilares-title"
          eyebrow="A assinatura"
          title={
            <>
              Quatro pilares. Um objetivo: <em>você entregando</em>.
            </>
          }
          sub="Cada pilar resolve uma etapa — o que implementar, como fazer, com quem contar."
        />
      </Reveal>

      <ol className={styles.grid}>
        {PILLARS.map((pillar, i) => (
          <Reveal key={pillar.slug} as="li" index={i} className={styles.item}>
            <a href={`#${pillar.slug}`} className={styles.card}>
              <span className={styles.index}>{pillar.index}</span>
              <span className={styles.name}>{pillar.name}</span>
              <span className={styles.teaser}>{pillar.teaser}</span>
              <span className={styles.jump} aria-hidden="true">
                <ArrowDown size={14} />
              </span>
            </a>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
