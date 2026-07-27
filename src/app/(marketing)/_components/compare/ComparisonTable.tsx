import { Check, Minus } from 'lucide-react';
import { COMPARISON } from '@/content/landing';
import { Section, SectionHeader, Reveal } from '../primitives';
import styles from './ComparisonTable.module.css';

/**
 * Comparação — <table> de verdade, com <caption> e <th scope>.
 *
 * Não é grade de divs: é dado tabular, e marcar como tabela é o que faz leitor de
 * tela anunciar "coluna Esta assinatura, linha Ferramentas incluídas" em vez de
 * despejar 24 células soltas.
 *
 * As marcas são `Check` em navy e `Minus` em cinza. NUNCA verde/vermelho — o design
 * system bane o semáforo, e aqui isso também evita que a tabela pareça acusação aos
 * concorrentes em vez de comparação.
 */
export function ComparisonTable() {
  const lastIndex = COMPARISON.columns.length - 1;

  return (
    <Section id="comparacao" labelledBy="comparacao-title">
      <SectionHeader id="comparacao-title" eyebrow={COMPARISON.eyebrow} title={COMPARISON.title} />

      <Reveal className={styles.scroller}>
        <table className={styles.table}>
          <caption className={styles.caption}>
            Comparação entre as alternativas de mercado e esta assinatura.
          </caption>
          <thead>
            <tr>
              <th scope="col" className={styles.rowHead}>
                <span className="sr-only">Recurso</span>
              </th>
              {COMPARISON.columns.map((col, i) => (
                <th
                  key={col}
                  scope="col"
                  className={[styles.colHead, i === lastIndex && styles.ours]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className={styles.rowHead}>
                  {row.label}
                </th>
                {row.values.map((value, i) => (
                  <td
                    key={i}
                    className={[styles.cell, i === lastIndex && styles.ours]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {value ? (
                      <Check size={17} strokeWidth={2.2} className={styles.yes} aria-label="sim" />
                    ) : (
                      <Minus size={17} strokeWidth={2} className={styles.no} aria-label="não" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
    </Section>
  );
}
