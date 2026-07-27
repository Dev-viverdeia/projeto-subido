import { Check } from 'lucide-react';
import { HUB } from '@/content/landing';
import { Section, SectionHeader, Reveal, AssetPlaceholder } from '../primitives';
import styles from './HubSection.module.css';

/**
 * Banda escura 2 de 3 — o destino da assinatura.
 *
 * O HUB é a carga emocional da oferta inteira E não existe ainda. Prometer demais
 * aqui é vender um emprego que não se pode entregar — e, no Brasil, é exposição de
 * CDC/CONAR.
 *
 * O princípio que resolve: vender o MECANISMO e a DATA, não o resultado. A timeline
 * mostra que dois terços já são entregáveis hoje, e isso persuade mais do que fingir
 * que os três estão no ar — porque o leitor pode verificar os dois primeiros no teste.
 *
 * O disclaimer fica NA seção, não em rodapé nem tooltip. Num mercado saturado de
 * "ganhe R$10k/mês em 30 dias", recusar-se a prometer renda é ativo de conversão:
 * é a frase que o comprador queimado printa.
 */
export function HubSection() {
  return (
    <Section id="hub" tone="navy" labelledBy="hub-title" space="loose">
      <div className={styles.grid}>
        <div className={styles.copy}>
          <Reveal>
            <span className={styles.pill}>{HUB.pill}</span>
          </Reveal>

          <SectionHeader
            id="hub-title"
            eyebrow={HUB.eyebrow}
            title={HUB.title}
            sub={HUB.body}
            tone="dark"
          />

          <Reveal index={2}>
            <ol className={styles.timeline}>
              {HUB.timeline.map((step) => (
                <li
                  key={step.label}
                  className={[styles.step, step.done ? styles.done : styles.pending].join(' ')}
                >
                  <span className={styles.marker} aria-hidden="true">
                    {step.done ? <Check size={13} strokeWidth={2.5} /> : null}
                  </span>
                  <span className={styles.stepLabel}>{step.label}</span>
                  <span className={styles.stepStatus}>{step.status}</span>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal index={3}>
            <p className={styles.criteria}>{HUB.criteria}</p>
          </Reveal>
        </div>

        <Reveal index={1} className={styles.preview}>
          <div className={styles.previewFrame}>
            <span className={styles.previewLabel}>Prévia da interface</span>
            <div className={styles.previewGrid}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={styles.profile}>
                  {/* Avatar silhueta apresentado como membro real seria uma mentira
                      pequena que custaria a postura de credibilidade da página. */}
                  <AssetPlaceholder label="perfil" tone="dark" />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal index={4}>
        <p className={styles.disclaimer}>{HUB.disclaimer}</p>
      </Reveal>
    </Section>
  );
}
