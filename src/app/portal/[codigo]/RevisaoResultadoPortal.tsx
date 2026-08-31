import { ArrowUpRight, BadgeCheck, CalendarClock, ChartNoAxesCombined } from 'lucide-react';
import {
  formatarDataEvolucao,
  ROTULO_DECISAO_EVOLUCAO,
  type EvolucaoProjeto,
} from '@/lib/projetos-execucao/evolucao';
import styles from './RevisaoResultadoPortal.module.css';

export function RevisaoResultadoPortal({ evolucao }: { evolucao: EvolucaoProjeto }) {
  const compartilhada =
    evolucao.status === 'registrada' &&
    evolucao.compartilharCliente &&
    evolucao.resultadoObservado &&
    evolucao.proximoPasso;

  return (
    <section className={styles.revisao} data-registrada={compartilhada || undefined}>
      <header>
        <span className={styles.icone}>
          {compartilhada ? (
            <ChartNoAxesCombined size={18} aria-hidden="true" />
          ) : (
            <CalendarClock size={18} aria-hidden="true" />
          )}
        </span>
        <div>
          <p>{compartilhada ? 'Revisão pós-entrega' : 'Próximo encontro'}</p>
          <h2>{compartilhada ? 'O resultado e o próximo passo.' : 'Vamos revisar o resultado.'}</h2>
        </div>
        <span className={styles.data}>
          {compartilhada ? <BadgeCheck size={14} /> : <CalendarClock size={14} />}
          {formatarDataEvolucao(evolucao.revisaoEm)}
        </span>
      </header>

      {compartilhada ? (
        <div className={styles.conteudo}>
          <article>
            <span>O que mudou na operação</span>
            <strong>{evolucao.resultadoObservado}</strong>
            {evolucao.evidenciaResultadoUrl && (
              <a href={evolucao.evidenciaResultadoUrl} target="_blank" rel="noreferrer">
                Ver evidência <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            )}
          </article>
          <article>
            <span>Decisão combinada</span>
            <strong>
              {evolucao.decisao ? ROTULO_DECISAO_EVOLUCAO[evolucao.decisao] : 'Registrada'}
            </strong>
            <p>{evolucao.proximoPasso}</p>
            {evolucao.proximoPassoEm && (
              <time dateTime={evolucao.proximoPassoEm}>
                Próximo passo em {formatarDataEvolucao(evolucao.proximoPassoEm)}
              </time>
            )}
          </article>
        </div>
      ) : (
        <div className={styles.agendada}>
          <p>
            Nesta conversa, vamos conferir o que mudou na operação e combinar o que acontece depois.
            Até lá, garantia, suporte e materiais seguem disponíveis neste portal.
          </p>
        </div>
      )}
    </section>
  );
}
