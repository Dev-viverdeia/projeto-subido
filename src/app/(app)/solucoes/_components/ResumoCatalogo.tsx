'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { SolucaoResumo } from '@/lib/conteudo/queries';
import {
  contarEtapasFeitas,
  estadoDaSolucao,
  solucaoMaisRecente,
  useProgresso,
} from '@/lib/progresso/local';
import styles from './ResumoCatalogo.module.css';

/**
 * A faixa de resumo do catálogo: quanto existe, onde a pessoa está, e o atalho
 * para voltar ao que ela deixou no meio.
 *
 * TODO NÚMERO AQUI É DERIVADO, nenhum é literal. "Disponíveis" vem da lista que o
 * servidor entregou; "em andamento" e "concluídas" saem de cruzar as etapas
 * marcadas neste navegador com as etapas de cada solução. Quem nunca marcou nada
 * vê 8 · 0 · 0, que é a verdade — e a retomada simplesmente não aparece.
 *
 * A RETOMADA É O ÚNICO ELEMENTO COM CTA da faixa, e some quando não há o que
 * retomar. Um card "comece agora" apontando para a primeira solução da lista
 * seria enfeite: a grade logo abaixo já faz isso melhor.
 *
 * `useSyncExternalStore` devolve o estado VAZIO no servidor (ver `local.ts`),
 * então o HTML sai com os zeros e o cliente corrige após a hidratação. É o custo
 * assumido de progresso local, e some no dia em que ele virar tabela.
 */
export function ResumoCatalogo({ solucoes }: { solucoes: SolucaoResumo[] }) {
  const progresso = useProgresso();

  let emAndamento = 0;
  let concluidas = 0;
  for (const s of solucoes) {
    const estado = estadoDaSolucao(contarEtapasFeitas(progresso, s.etapaIds), s.etapaIds.length);
    if (estado === 'em-andamento') emAndamento += 1;
    if (estado === 'concluida') concluidas += 1;
  }

  /* A retomada aponta para a última solução TOCADA que ainda não terminou. Se a
     última tocada já está concluída, não há o que retomar nela — e mandar a
     pessoa de volta a um checklist cheio seria pior que não mostrar nada. */
  const slugRecente = solucaoMaisRecente(progresso);
  const recente = slugRecente ? solucoes.find((s) => s.slug === slugRecente) : undefined;
  const feitasRecente = recente ? contarEtapasFeitas(progresso, recente.etapaIds) : 0;
  const retomar =
    recente && feitasRecente > 0 && feitasRecente < recente.etapaIds.length ? recente : null;

  return (
    <section className={styles.faixa} aria-label="Resumo do catálogo">
      <div className={styles.medida}>
        <p className={styles.rotulo}>Disponíveis</p>
        <p className={styles.valor}>
          <span className={styles.numero}>{solucoes.length}</span>{' '}
          <span className={styles.unidade}>{solucoes.length === 1 ? 'solução' : 'soluções'}</span>
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
        <Link href={`/solucoes/${retomar.slug}`} className={styles.retomar}>
          <span className={styles.retomarTextos}>
            <span className={styles.rotulo}>Retomar</span>
            <span className={styles.retomarTitulo}>{retomar.titulo}</span>
            <span className={styles.retomarEtapa}>
              etapa {feitasRecente + 1} de {retomar.etapaIds.length}
            </span>
          </span>
          <span className={styles.seta} aria-hidden="true">
            <ArrowRight size={16} strokeWidth={2} />
          </span>
        </Link>
      )}
    </section>
  );
}
