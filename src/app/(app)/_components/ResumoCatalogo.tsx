'use client';

import Link from 'next/link';
import { estadoDoProgresso } from '@/lib/progresso/local';
import styles from './ResumoCatalogo.module.css';

/**
 * A faixa de resumo de um catálogo: quanto existe, onde a pessoa está, e o atalho
 * para voltar ao que ela deixou no meio.
 *
 * GENÉRICA PORQUE OS DOIS CATÁLOGOS FAZEM A MESMA PERGUNTA. Soluções contava
 * etapas aqui; formações tinha um componente separado (`RetomadaFormacao`) que só
 * fazia a retomada, sem as medidas — então o catálogo de formações abria sem
 * responder "quanto existe" nem "quanto eu já fiz". Uma faixa, dois pilares.
 *
 * TODO NÚMERO AQUI É DERIVADO, nenhum é literal. "Disponíveis" vem da lista que o
 * servidor entregou; "em andamento" e "concluídas" saem de cruzar o que está
 * marcado NESTE navegador com os itens de cada conteúdo. Quem nunca marcou nada
 * vê 8 · 0 · 0, que é a verdade — e a retomada simplesmente não aparece.
 *
 * A RETOMADA É O ÚNICO ELEMENTO COM CTA da faixa, e some quando não há o que
 * retomar. Um card "comece agora" apontando para o primeiro da lista seria
 * enfeite: a grade logo abaixo já faz isso melhor.
 *
 * SETA EM SVG INLINE, não `lucide`: este arquivo é client, e o `ArrowRight` que
 * estava aqui arrastava a biblioteca para o bundle do navegador por causa de uma
 * flecha de 16px.
 *
 * `useSyncExternalStore` devolve o estado VAZIO no servidor (ver `local.ts`),
 * então o HTML sai com os zeros e o cliente corrige após a hidratação. É o custo
 * assumido de progresso local, e some no dia em que ele virar tabela.
 */
export type LinhaResumo = {
  slug: string;
  titulo: string;
  /** Quantos itens deste conteúdo estão marcados neste navegador. */
  feitas: number;
  /** Quantos itens ele tem no total. */
  total: number;
};

function Seta() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h9m0 0L8.5 4.5M12 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ResumoCatalogo({
  linhas,
  base,
  unidade,
  itemUnidade,
  slugRecente,
}: {
  linhas: LinhaResumo[];
  /** Prefixo da rota de detalhe: `/solucoes`, `/formacoes`. */
  base: string;
  /** O que se conta no catálogo: solução, formação. */
  unidade: { singular: string; plural: string };
  /** O que se conta dentro de um item: etapa, aula. */
  itemUnidade: { singular: string; plural: string };
  /** O slug tocado mais recentemente, ou null. Quem lê o progresso é o pai. */
  slugRecente: string | null;
}) {
  let emAndamento = 0;
  let concluidas = 0;
  for (const l of linhas) {
    const estado = estadoDoProgresso(l.feitas, l.total);
    if (estado === 'em-andamento') emAndamento += 1;
    if (estado === 'concluida') concluidas += 1;
  }

  /* A retomada aponta para o último conteúdo TOCADO que ainda não terminou. Se o
     último tocado já está concluído, não há o que retomar nele — e mandar a
     pessoa de volta a uma lista cheia seria pior que não mostrar nada. */
  const recente = slugRecente ? linhas.find((l) => l.slug === slugRecente) : undefined;
  const retomar = recente && recente.feitas > 0 && recente.feitas < recente.total ? recente : null;

  return (
    <section className={styles.faixa} aria-label="Resumo do catálogo">
      <div className={styles.medida}>
        <p className={styles.rotulo}>Disponíveis</p>
        <p className={styles.valor}>
          <span className={styles.numero}>{linhas.length}</span>{' '}
          <span className={styles.unidade}>
            {linhas.length === 1 ? unidade.singular : unidade.plural}
          </span>
        </p>
      </div>

      <div className={styles.medida}>
        <p className={styles.rotulo}>Em andamento</p>
        <p className={styles.valor}>
          <span className={styles.numero} data-zero={emAndamento === 0 ? '' : undefined}>
            {emAndamento}
          </span>
        </p>
      </div>

      <div className={styles.medida}>
        <p className={styles.rotulo}>Concluídas</p>
        <p className={styles.valor}>
          <span className={styles.numero} data-zero={concluidas === 0 ? '' : undefined}>
            {concluidas}
          </span>
        </p>
      </div>

      {retomar && (
        <Link href={`${base}/${retomar.slug}`} className={styles.retomar}>
          <span className={styles.retomarTextos}>
            <span className={styles.rotulo}>Retomar</span>
            <span className={styles.retomarTitulo}>{retomar.titulo}</span>
            <span className={styles.retomarEtapa}>
              {itemUnidade.singular} {retomar.feitas + 1} de {retomar.total}
            </span>
          </span>
          <span className={styles.seta} aria-hidden="true">
            <Seta />
          </span>
        </Link>
      )}
    </section>
  );
}
