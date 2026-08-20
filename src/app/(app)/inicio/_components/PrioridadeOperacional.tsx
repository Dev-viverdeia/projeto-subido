import Link from 'next/link';
import { ArrowRight, Bot, CheckCircle2 } from 'lucide-react';
import styles from './MapaJornada.module.css';

export type PrioridadeOperacionalProps = {
  modo: string;
  etapa: string;
  foco: string;
  titulo: string;
  detalhe: string;
  rotuloEvidencia?: string;
  evidencia: string;
  destino: string;
  acao: string;
};

/**
 * A única direção de trabalho da Início. A origem dos fatos fica explícita e
 * o CTA sempre aponta para o registro resolvido pelo Sobral AI.
 */
export function PrioridadeOperacional({
  modo,
  etapa,
  foco,
  titulo,
  detalhe,
  rotuloEvidencia = 'Concluído quando',
  evidencia,
  destino,
  acao,
}: PrioridadeOperacionalProps) {
  const modoVisivel =
    modo === 'prioridade da operação'
      ? 'prioridade atual'
      : modo === 'plano da jornada'
        ? 'plano de trabalho'
        : modo;
  const rotuloVisivel =
    rotuloEvidencia === 'Evidência atual'
      ? 'Status atual'
      : rotuloEvidencia === 'Registro de conclusão'
        ? 'Concluído quando'
        : rotuloEvidencia;

  return (
    <article className={styles.prioridade}>
      <div className={styles.prioridadeTopo}>
        <span>
          <Bot size={14} strokeWidth={1.9} aria-hidden="true" /> Sobral AI · {modoVisivel}
        </span>
        <em>{etapa}</em>
      </div>

      <p className={styles.prioridadeFoco}>{foco}</p>
      <h1>{titulo}</h1>
      <p className={styles.prioridadeDescricao}>{detalhe}</p>

      <div className={styles.prioridadeAcoes}>
        <Link href={destino} className={styles.botaoPrimario}>
          {acao}
          <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
        </Link>
        <Link href="/consultor" className={styles.abrirLeitura}>
          Ver orientação completa
        </Link>
      </div>

      <div className={styles.evidenciaPrioridade}>
        <CheckCircle2 size={16} strokeWidth={1.9} aria-hidden="true" />
        <span>
          <small>{rotuloVisivel}</small>
          <strong>{evidencia}</strong>
        </span>
      </div>
    </article>
  );
}

export function PrioridadeOperacionalCarregando() {
  return (
    <article className={`${styles.prioridade} ${styles.prioridadeCarregando}`} aria-busy="true">
      <div className={styles.prioridadeTopo}>
        <span>
          <Bot size={14} strokeWidth={1.9} aria-hidden="true" /> Sobral AI · analisando seus dados
        </span>
      </div>
      <h1>Organizando sua próxima ação.</h1>
      <p className={styles.prioridadeDescricao}>
        Estamos verificando vendas, reuniões, propostas e projetos.
      </p>
      <span className={styles.carregandoLinha} aria-hidden="true" />
    </article>
  );
}
