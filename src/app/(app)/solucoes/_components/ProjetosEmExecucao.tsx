import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Check, CircleDot, FolderKanban } from 'lucide-react';
import type { ResumoProjetoExecucao } from '@/lib/projetos-execucao/queries';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';
import styles from './ProjetosEmExecucao.module.css';

function prazo(valor: string | null): string {
  if (!valor) return 'Sem prazo';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  })
    .format(new Date(valor))
    .replace('.', '');
}

export function ProjetosEmExecucao({ projetos }: { projetos: ResumoProjetoExecucao[] }) {
  if (!projetos.length) return null;
  const ativos = projetos.filter((projeto) => projeto.status !== 'concluido').length;
  const concluidos = projetos.filter((projeto) => projeto.status === 'concluido').length;

  return (
    <section
      className={styles.carteira}
      data-layout={projetos.length === 1 ? 'destaque' : undefined}
      aria-labelledby="titulo-carteira"
    >
      <header className={styles.cabecalho}>
        <div>
          <p>Carteira de entregas</p>
          <h1 id="titulo-carteira">O trabalho que está em campo.</h1>
        </div>
        <dl>
          <div>
            <dt>Ativos</dt>
            <dd>{ativos}</dd>
          </div>
          <div>
            <dt>Entregues</dt>
            <dd>{concluidos}</dd>
          </div>
        </dl>
      </header>

      <ol className={styles.grade}>
        {projetos.slice(0, 6).map((projeto) => {
          const percentual = projeto.total ? Math.round((projeto.feitas / projeto.total) * 100) : 0;
          return (
            <li key={projeto.id}>
              <Link href={`/solucoes/execucao/${projeto.id}`}>
                <div className={styles.cartaoTopo}>
                  <span className={styles.icone}>
                    {projeto.status === 'concluido' ? (
                      <Check size={16} aria-hidden="true" />
                    ) : (
                      <FolderKanban size={16} aria-hidden="true" />
                    )}
                  </span>
                  <span className={styles.estado} data-status={projeto.status}>
                    {ROTULO_STATUS_PROJETO[projeto.status]}
                  </span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </div>

                <div className={styles.cartaoCorpo}>
                  <p>{projeto.empresa}</p>
                  <h2>{projeto.titulo}</h2>
                </div>

                <div className={styles.proxima}>
                  <CircleDot size={14} aria-hidden="true" />
                  <span>
                    <small>Próxima ação</small>
                    {projeto.proximaTarefa ?? 'Formalizar a entrega final'}
                  </span>
                </div>

                <footer>
                  <div className={styles.progresso}>
                    <span style={{ transform: `scaleX(${percentual / 100})` }} />
                  </div>
                  <strong>{percentual}%</strong>
                  <span>
                    <CalendarDays size={13} aria-hidden="true" /> {prazo(projeto.prazoEm)}
                  </span>
                </footer>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
