import { FAQ, FAQ_META } from '@/content/landing';
import { Section, SectionHeader, Reveal } from '../primitives';
import styles from './FaqSection.module.css';

/**
 * FAQ — `<details>`/`<summary>` nativos. Zero JavaScript.
 *
 * Acessibilidade, busca do navegador (Ctrl+F encontra texto fechado) e indexação
 * saem de graça, e o conteúdo continua no HTML mesmo fechado — o que importa, já que
 * o JSON-LD `FAQPage` é gerado do MESMO array. Divergência entre o FAQ visível e o
 * structured data é gatilho documentado de manual action do Google; gerando dos dois
 * do mesmo dado, a divergência fica estruturalmente impossível.
 *
 * Duas perguntas aqui — se o HUB está no ar e qual o papel do Pedro — são as que um
 * comprador cético realmente tem, e as que uma página de hype desvia. Respondê-las
 * com a verdade literal do acordo é o que dá autoridade a todo o resto.
 */
export function FaqSection() {
  return (
    <Section id="perguntas" width="content" labelledBy="perguntas-title">
      <SectionHeader id="perguntas-title" eyebrow={FAQ_META.eyebrow} title={FAQ_META.title} />

      <div className={styles.list}>
        {FAQ.map((item, i) => (
          <Reveal key={item.q} index={Math.min(i, 4)}>
            <details className={styles.item}>
              <summary className={styles.question}>
                <span className={styles.index}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.questionText}>{item.q}</span>
                <span className={styles.icon} aria-hidden="true" />
              </summary>
              <div className={styles.answer}>
                <p>{item.a}</p>
              </div>
            </details>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
