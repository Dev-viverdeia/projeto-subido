'use client';

import { useState } from 'react';
import type { ItemSolucao } from '@/lib/conteudo/queries';
import { alternarEtapa, useProgresso } from '@/lib/progresso/local';
import { Visto } from './PillEstado';
import styles from './PassoAPasso.module.css';

/** Id do elemento de uma etapa — a ficha usa o mesmo cálculo para rolar até ela. */
export function idDaEtapa(etapaId: string): string {
  return `etapa-${etapaId}`;
}

function Chevron() {
  return (
    <svg
      className={styles.chevron}
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6.5 8 10.5 12 6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * O passo a passo — uma TIMELINE, não uma lista numerada.
 *
 * POR QUE TIMELINE E NÃO LISTA. A lista anterior mostrava os cinco textos
 * abertos ao mesmo tempo: cinco parágrafos de peso igual, sem lugar para o olho
 * pousar, e nenhuma pista de onde a pessoa parou. Aqui só a etapa ATUAL está
 * aberta, o fio vertical liga o feito ao que falta, e a posição vira a
 * informação principal. É o mesmo dado — a mudança é de hierarquia.
 *
 * A ETAPA ATUAL É CALCULADA FORA (`etapaAtualId`), não aqui. Quem também precisa
 * dela é o trilho de progresso, que diz "Próxima: …" — duas derivações da mesma
 * regra divergiriam no dia em que a regra mudasse.
 *
 * ABERTURA SEM `useEffect`. O estado guarda apenas as decisões EXPLÍCITAS da
 * pessoa (`override`); a abertura padrão é derivada na hora. Sincronizar
 * "abrir a nova etapa atual" por efeito era o caminho óbvio e teria trocado uma
 * derivação de uma linha por um efeito com dependência de prop — o mesmo laço que
 * o contexto da trilha já pagou uma vez.
 *
 * O CHECKBOX CONTINUA SENDO O CONTROLE de marcar/desmarcar: espaço alterna, o
 * leitor de tela anuncia o estado, e o círculo da timeline é o `<label>` dele. O
 * botão dentro do painel é um segundo caminho para a mesma ação — não um segundo
 * estado.
 *
 * PROGRESSO DESTE NAVEGADOR — a limitação está dita no `local.ts`.
 */
export function PassoAPasso({
  etapas,
  slug,
  etapaAtualId,
}: {
  etapas: ItemSolucao[];
  slug: string;
  /** A primeira não marcada. `null` quando todas estão feitas. */
  etapaAtualId: string | null;
}) {
  const progresso = useProgresso();
  const [override, setOverride] = useState<Record<string, boolean>>({});
  const [todas, setTodas] = useState(false);

  if (etapas.length === 0) return null;

  const feitas = etapas.reduce((n, e) => (progresso.etapas[e.id] ? n + 1 : n), 0);
  const aberta = (id: string) => override[id] ?? (todas || id === etapaAtualId);

  const alternarTodas = () => {
    setTodas((v) => !v);
    /* Limpa as decisões individuais: sem isso, "expandir todas" deixaria fechada
       justamente a etapa que a pessoa fechou à mão, e o rótulo mentiria. */
    setOverride({});
  };

  return (
    <section aria-labelledby="passo-a-passo-titulo" className={styles.secao}>
      <div className={styles.cabecalho}>
        <h2 id="passo-a-passo-titulo" className={styles.titulo}>
          Passo a passo
        </h2>

        <div className={styles.controles}>
          {/* Mono e caixa-alta por CONTEÚDO: precisa do tracking de eyebrow mesmo
              sem `text-transform`, porque a forma das letras é que pede. */}
          <p className={styles.contagem} aria-live="polite">
            <span className={styles.feitas}>{feitas}</span> DE {etapas.length} CONCLUÍDAS
          </p>
          <button type="button" className={styles.expandir} onClick={alternarTodas}>
            {todas ? 'recolher todas' : 'expandir todas'}
          </button>
        </div>
      </div>

      <ol className={styles.lista}>
        {etapas.map((etapa, i) => {
          const feita = Boolean(progresso.etapas[etapa.id]);
          const atual = etapa.id === etapaAtualId;
          const abertaAgora = aberta(etapa.id);
          const idCampo = `marca-${etapa.id}`;
          const idPainel = `painel-${etapa.id}`;

          return (
            <li
              key={etapa.id}
              id={idDaEtapa(etapa.id)}
              className={styles.passo}
              data-feita={feita ? '' : undefined}
              data-atual={atual ? '' : undefined}
            >
              <div className={styles.trilho}>
                <input
                  type="checkbox"
                  id={idCampo}
                  className={styles.marca}
                  checked={feita}
                  onChange={() => alternarEtapa(etapa.id, slug)}
                />
                {/* O CÍRCULO É O RÓTULO do checkbox: vira alvo de clique de 28px
                    sem inventar um segundo controle ao lado dele. */}
                <label className={styles.circulo} htmlFor={idCampo}>
                  <span aria-hidden="true" className={styles.numero}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span aria-hidden="true" className={styles.check}>
                    <Visto tamanho={12} />
                  </span>
                  <span className="sr-only">
                    {feita ? 'Desmarcar' : 'Marcar como feita'}: {etapa.titulo}
                  </span>
                </label>
              </div>

              <div className={styles.corpo}>
                <button
                  type="button"
                  className={styles.linha}
                  aria-expanded={abertaAgora}
                  aria-controls={idPainel}
                  onClick={() => setOverride((o) => ({ ...o, [etapa.id]: !abertaAgora }))}
                >
                  <span className={styles.tituloPasso}>{etapa.titulo}</span>

                  {atual && <span className={styles.aqui}>você está aqui</span>}
                  {feita && !atual && <span className={styles.feitaRotulo}>feita</span>}

                  <Chevron />
                </button>

                {/* `0fr → 1fr`: anima a altura sem conhecer o conteúdo e sem
                    animar `height`. `inert` porque uma altura zero ainda é
                    tabulável — o painel fechado prenderia o teclado. */}
                <div
                  id={idPainel}
                  className={styles.painel}
                  data-aberta={abertaAgora ? '' : undefined}
                  inert={!abertaAgora}
                >
                  <div className={styles.painelInterno}>
                    {etapa.conteudo && <p className={styles.texto}>{etapa.conteudo}</p>}

                    {/* PRENDE O PAINEL ABERTO, e isso conserta um defeito de
                        teclado que só aparece medindo o `activeElement`.

                        Sem o `override`, marcar a etapa atual por ESTE botão faz
                        `etapaAtualId` avançar; a abertura deste painel era
                        derivada de `id === etapaAtualId`, então ele colapsa e o
                        `inert` cai sobre o ancestral do botão que acabou de
                        receber o Enter. Pela regra de fixup do HTML, foco dentro
                        de subárvore inerte é descartado — `document.activeElement`
                        volta a ser o `<body>` e o próximo Tab recomeça do topo do
                        documento, no meio de um checklist.

                        O checkbox do círculo nunca teve o problema: ele vive fora
                        do painel. Era só este caminho. */}
                    <button
                      type="button"
                      className={styles.acao}
                      data-feita={feita ? '' : undefined}
                      onClick={() => {
                        setOverride((o) => ({ ...o, [etapa.id]: true }));
                        alternarEtapa(etapa.id, slug);
                      }}
                    >
                      {feita ? (
                        'Marcar como não feita'
                      ) : (
                        <>
                          <Visto tamanho={12} />
                          Marcar como feita
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
