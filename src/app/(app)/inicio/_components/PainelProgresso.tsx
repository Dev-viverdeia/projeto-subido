'use client';

import { contarConcluidas, percentual, useProgresso } from '@/lib/progresso/local';
import styles from './PainelProgresso.module.css';

const DIA_MS = 86_400_000;

/**
 * OS GRÁFICOS do início — dois, e cada um responde uma pergunta:
 *
 * 1. BARRAS por formação: "onde estou em cada trilha?" — percentual real do
 *    progresso local, barra por formação, número junto da barra.
 * 2. COLUNAS de atividade: "eu tenho constância?" — marcações (aulas + etapas)
 *    por dia nos últimos 14 dias, lidas dos timestamps que o progresso grava.
 *
 * CSS puro, sem biblioteca: são um trilho com preenchimento e uma fileira de
 * colunas — carregar um pacote de gráficos para isso seria peso sem retorno.
 * Tudo deriva do progresso REAL; sem dado, cada gráfico diz isso em uma linha
 * em vez de desenhar eixos vazios.
 */
export function PainelProgresso({
  formacoes,
  agoraIso,
}: {
  formacoes: { slug: string; titulo: string; aulaIds: string[] }[];
  /** O instante do servidor — mesma âncora nos dois lados da hidratação. */
  agoraIso: string;
}) {
  const progresso = useProgresso();

  const comAulas = formacoes.filter((f) => f.aulaIds.length > 0);
  const barras = comAulas
    .map((f) => {
      const feitas = contarConcluidas(progresso, f.aulaIds);
      return { ...f, feitas, pct: percentual(feitas, f.aulaIds.length) };
    })
    .sort((a, b) => b.pct - a.pct);
  const haProgresso = barras.some((b) => b.feitas > 0);

  /* Atividade: toda marcação com timestamp — aulas e etapas — agregada por dia
     local. O dia de hoje é o do SERVIDOR, para o SSR e o cliente concordarem. */
  const fimDeHoje = new Date(agoraIso);
  fimDeHoje.setHours(23, 59, 59, 999);
  const marcacoes = [...Object.values(progresso.aulas), ...Object.values(progresso.etapas)];

  const dias = Array.from({ length: 14 }, (_, i) => {
    const dia = new Date(fimDeHoje.getTime() - (13 - i) * DIA_MS);
    const chave = dia.toDateString();
    const total = marcacoes.filter((iso) => new Date(iso).toDateString() === chave).length;
    return { chave, total, rotulo: dia.getDate() };
  });
  const teto = Math.max(...dias.map((d) => d.total), 1);
  const totalJanela = dias.reduce((n, d) => n + d.total, 0);

  return (
    <div className={styles.paineis}>
      <section className={styles.painel} aria-labelledby="inicio-progresso">
        <h2 id="inicio-progresso" className={styles.eyebrow}>
          Progresso nas formações
        </h2>

        {barras.length === 0 ? (
          <p className={styles.semDados}>Nenhuma formação publicada ainda.</p>
        ) : (
          <ul className={styles.barras}>
            {barras.map((b) => (
              <li key={b.slug} className={styles.barraLinha}>
                <span className={styles.barraTitulo}>{b.titulo}</span>
                <span className={styles.barraNumero}>
                  {b.feitas}/{b.aulaIds.length}
                </span>
                <span
                  className={styles.trilho}
                  role="progressbar"
                  aria-valuenow={b.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${b.pct}% de ${b.titulo}`}
                >
                  <span className={styles.preenchido} style={{ width: `${b.pct}%` }} />
                </span>
              </li>
            ))}
          </ul>
        )}

        {!haProgresso && barras.length > 0 && (
          <p className={styles.semDados}>As barras enchem conforme você conclui aulas.</p>
        )}
      </section>

      <section className={styles.painel} aria-labelledby="inicio-atividade">
        <div className={styles.atividadeTopo}>
          <h2 id="inicio-atividade" className={styles.eyebrow}>
            Atividade · 14 dias
          </h2>
          <span className={styles.atividadeTotal}>
            {totalJanela} {totalJanela === 1 ? 'marcação' : 'marcações'}
          </span>
        </div>

        {totalJanela === 0 ? (
          <p className={styles.semDados}>
            Cada aula ou etapa concluída vira uma coluna aqui — constância fica visível.
          </p>
        ) : (
          <div className={styles.colunas} aria-hidden="true">
            {dias.map((d) => (
              <span key={d.chave} className={styles.coluna} title={`${d.total} no dia ${d.rotulo}`}>
                <span
                  className={styles.colunaBarra}
                  data-vazia={d.total === 0 ? '' : undefined}
                  style={{ height: `${Math.max((d.total / teto) * 100, 4)}%` }}
                />
                <span className={styles.colunaRotulo}>{d.rotulo}</span>
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
