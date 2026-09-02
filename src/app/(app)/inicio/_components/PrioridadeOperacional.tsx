import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './MapaJornada.module.css';

export type PrioridadeOperacionalProps = {
  etapa: string;
  titulo: string;
  detalhe: string;
  evidencia: string;
  destino: string;
  acao: string;
};

/**
 * A única direção de trabalho da Início. A origem dos fatos fica explícita e
 * o CTA sempre aponta para o registro que resolve a tarefa.
 */
export function PrioridadeOperacional({
  etapa,
  titulo,
  detalhe,
  evidencia,
  destino,
  acao,
}: PrioridadeOperacionalProps) {
  return (
    <article className={styles.prioridade}>
      <span className={styles.prioridadeRotulo}>Próxima ação · {etapa}</span>
      <h1>{titulo}</h1>
      <p className={styles.prioridadeDescricao}>{detalhe}</p>

      <div className={styles.prioridadeRodape}>
        <Link href={destino} className={styles.botaoPrimario}>
          {acao}
          <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
        </Link>
        <span className={styles.evidencia}>
          <small>Status</small>
          <strong>{evidencia}</strong>
        </span>
      </div>
    </article>
  );
}

export function PrioridadeOperacionalCarregando() {
  return (
    <article className={`${styles.prioridade} ${styles.prioridadeCarregando}`} aria-busy="true">
      <span className={styles.prioridadeRotulo}>Próxima ação</span>
      <h1>Organizando seu trabalho.</h1>
      <span className={styles.carregandoLinha} aria-hidden="true" />
      <span className="sr-only">Verificando seu trabalho atual</span>
    </article>
  );
}
