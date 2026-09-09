import { BadgeCheck, CalendarDays, Check, Clock3, FolderCheck, LockKeyhole } from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { ProjetoPortalCliente } from '@/lib/portal-cliente/tipos';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';
import styles from './PortalProjeto.module.css';

export function dataPortal(valor: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
    .format(new Date(valor))
    .replace('.', '');
}

export function CabecalhoPortal({ projeto }: { projeto: ProjetoPortalCliente }) {
  const concluido = projeto.status === 'concluido';
  const aceite = projeto.encerramento?.status === 'encerrado';
  const percentual = projeto.total ? Math.round((projeto.feitas / projeto.total) * 100) : 0;
  const fases = Array.from(new Set(projeto.tarefas.map((tarefa) => tarefa.faseId))).map((id) => {
    const tarefas = projeto.tarefas.filter((tarefa) => tarefa.faseId === id);
    return {
      id,
      titulo: tarefas[0]!.faseTitulo,
      completa: tarefas.every((tarefa) => tarefa.status === 'concluida'),
    };
  });
  const atual = fases.find((fase) => !fase.completa)?.id;
  return (
    <>
      <header className={styles.barra}>
        <SubidoLogo size={19} />
        <span>
          <LockKeyhole size={15} aria-hidden="true" /> Acesso protegido
        </span>
      </header>
      <section className={styles.hero} aria-label="Resumo do projeto">
        <div className={styles.heroTexto}>
          <p>{projeto.empresa}</p>
          <h1>{projeto.titulo}</h1>
          {!concluido && (
            <span className={styles.prazo}>
              <CalendarDays size={16} aria-hidden="true" />
              {projeto.prazoEm ? `Previsão: ${dataPortal(projeto.prazoEm)}` : 'Prazo em definição'}
            </span>
          )}
        </div>
        <div className={styles.statusProjeto} data-concluido={concluido || undefined}>
          <span className={styles.statusIcone}>
            {concluido ? (
              aceite ? (
                <BadgeCheck size={24} aria-hidden="true" />
              ) : (
                <FolderCheck size={24} aria-hidden="true" />
              )
            ) : (
              <Clock3 size={24} aria-hidden="true" />
            )}
          </span>
          <div>
            <strong>
              {concluido ? 'Projeto concluído' : ROTULO_STATUS_PROJETO[projeto.status]}
            </strong>
            <span>
              {concluido ? (
                aceite ? (
                  'Aceite confirmado'
                ) : (
                  'Entrega registrada pelo profissional'
                )
              ) : (
                <>
                  <b>{percentual}%</b> <span>executado</span>
                </>
              )}
            </span>
            {concluido && aceite && projeto.encerramento?.aceitoEm && (
              <time dateTime={projeto.encerramento.aceitoEm}>
                {dataPortal(projeto.encerramento.aceitoEm)}
              </time>
            )}
          </div>
        </div>
        {!concluido && fases.length > 0 && (
          <ol className={styles.fases} aria-label="Andamento por fase">
            {fases.map((fase) => (
              <li
                key={fase.id}
                data-completa={fase.completa || undefined}
                aria-current={fase.id === atual ? 'step' : undefined}
              >
                <span aria-hidden="true">
                  {fase.completa ? <Check size={15} /> : <span className={styles.marco} />}
                </span>
                {fase.titulo}
                <span className={styles.srOnly}>
                  {fase.completa
                    ? ': concluída'
                    : fase.id === atual
                      ? ': em andamento'
                      : ': pendente'}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
