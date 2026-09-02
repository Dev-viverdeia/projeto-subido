import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import type { PlanoJornada } from '@/lib/jornada/motor';
import styles from './MapaJornada.module.css';

type Props = {
  nome: string | null;
  prioridade: ReactNode;
  proximaMentoria?: ReactNode;
  plano: PlanoJornada;
};

function TrilhoDaJornada({ plano }: { plano: PlanoJornada }) {
  return (
    <ol className={styles.trilho} aria-label="Etapas do trabalho">
      {plano.etapas.map((etapa) => (
        <li
          key={etapa.id}
          data-status={etapa.status}
          aria-current={etapa.id === plano.etapaAtual ? 'step' : undefined}
          aria-label={`${etapa.titulo}${etapa.id === plano.etapaAtual ? ', etapa atual' : ''}`}
        >
          <span className={styles.segmento} aria-hidden="true" />
          <span>{etapa.titulo}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * A Início responde uma pergunta: o que merece atenção agora.
 *
 * Áreas e ferramentas continuam na navegação. Aqui ficam apenas a ação principal,
 * a etapa que a explica e o próximo encontro ao vivo.
 */
export function MapaJornada({ nome, prioridade, proximaMentoria, plano }: Props) {
  const data = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  });
  const hora = Number(
    new Intl.DateTimeFormat('pt-BR', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date()),
  );
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className={`${styles.pagina} pagina-mapa-jornada`}>
      <header className={styles.topo}>
        <div>
          <span>{data}</span>
          <p>
            {saudacao}
            {nome ? `, ${nome}` : ''}.
          </p>
        </div>
      </header>

      <section className={styles.comando} aria-label="Próxima ação">
        {prioridade}

        <aside className={styles.progresso} aria-label="Progresso do trabalho">
          <span>Progresso</span>
          <strong>{plano.percentual}%</strong>
          <p>
            {plano.evidenciasConcluidas} de {plano.totalEvidencias} passos
          </p>
          <div
            className={styles.progressoTrilho}
            role="progressbar"
            aria-label="Progresso do trabalho"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={plano.percentual}
          >
            <span style={{ width: `${plano.percentual}%` }} />
          </div>
        </aside>

        <TrilhoDaJornada plano={plano} />
      </section>

      <Link href="/mentorias" className={styles.mentoria}>
        <CalendarDays size={20} strokeWidth={1.7} aria-hidden="true" />
        <span>
          <small>Mentorias</small>
          <strong>{proximaMentoria ?? 'Ver próximos encontros'}</strong>
        </span>
        <em>
          Ver agenda <ArrowRight size={16} strokeWidth={1.9} aria-hidden="true" />
        </em>
      </Link>
    </div>
  );
}
