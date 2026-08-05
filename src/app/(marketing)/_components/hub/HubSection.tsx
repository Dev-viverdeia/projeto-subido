import { Check } from 'lucide-react';
import type { StaticImageData } from 'next/image';
import { HUB } from '@/content/landing';
import { Section, SectionHeader, Reveal, RetratoFicticio } from '../primitives';
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
/**
 * ONDE AS FOTOS DOS PERFIS ENTRAM. Chave = `nome` em HUB.perfis.
 *
 * Mesmo contrato do mapa de depoimentos: enquanto a chave não existe, o cartão cai
 * no retrato ilustrado. Ver src/assets/img/RETRATOS.md para nomes e especificação.
 */
const FOTOS: Record<string, StaticImageData> = {};

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
              {/* Perfis INVENTADOS (ver CONTEUDO_DEMO). O rótulo "Prévia da interface"
                  acima e a pílula "em construção" no cabeçalho da seção são o que
                  impede isto de ler como diretório já povoado — sem eles, seis pessoas
                  numa grade afirmam que o HUB existe, e a seção inteira é sobre não
                  prometer o que ainda não existe. */}
              {HUB.perfis.map((perfil) => (
                <div key={perfil.nome} className={styles.profile}>
                  <RetratoFicticio
                    nome={perfil.nome}
                    foto={FOTOS[perfil.nome]}
                    tamanho={48}
                    tone="dark"
                  />
                  <span className={styles.profileNome}>{perfil.nome}</span>
                  <span className={styles.profileMeta}>
                    {perfil.foco} · {perfil.local}
                  </span>
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
