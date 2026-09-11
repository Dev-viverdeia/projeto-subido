import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, CalendarDays, Check, Repeat2, ShieldCheck } from 'lucide-react';
import type { ProjetoExecucaoCompleto } from '@/lib/projetos-execucao/queries';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';
import { formatarDataProjeto } from '@/lib/projetos-execucao/prazo';
import { estaEmAcompanhamento } from '@/lib/projetos-execucao/gestao';
import styles from './CabecalhoEntrega.module.css';

export function CabecalhoEntrega({
  projeto,
  preparando,
  children,
}: {
  projeto: ProjetoExecucaoCompleto;
  preparando: boolean;
  children: ReactNode;
}) {
  const concluido = projeto.status === 'concluido';
  const acompanhado = estaEmAcompanhamento(projeto);
  const aceito = projeto.encerramento?.status === 'encerrado';
  const percentual = projeto.total ? Math.round((projeto.feitas / projeto.total) * 100) : 0;
  const estado = acompanhado
    ? 'Em acompanhamento'
    : concluido
      ? 'Entrega concluída'
      : preparando
        ? 'Preparação'
        : ROTULO_STATUS_PROJETO[projeto.status];
  const Icone = acompanhado ? Repeat2 : aceito ? ShieldCheck : Check;

  return (
    <header className={styles.cabecalho}>
      <div className={styles.trilho}>
        <Link href="/entregas">
          <ArrowLeft size={17} aria-hidden="true" /> Entregas
        </Link>
        <span className={styles.estado} data-concluido={concluido || undefined}>
          {concluido && <Icone size={16} aria-hidden="true" />}
          {estado}
        </span>
      </div>
      <div className={styles.principal}>
        <div className={styles.identidade}>
          <p>{projeto.empresa}</p>
          <h1>{projeto.titulo}</h1>
        </div>
        {children}
      </div>
      <div className={styles.rodape}>
        <span className={styles.prazo}>
          <CalendarDays size={17} aria-hidden="true" />
          {concluido
            ? projeto.concluidoEm
              ? `Entregue em ${formatarDataProjeto(projeto.concluidoEm)}`
              : 'Entrega registrada'
            : `Prazo: ${projeto.prazoEm ? formatarDataProjeto(projeto.prazoEm) : 'a definir'}`}
        </span>
        {concluido ? (
          <span className={styles.aceite}>
            {aceito ? (
              <ShieldCheck size={17} aria-hidden="true" />
            ) : (
              <Check size={17} aria-hidden="true" />
            )}
            {aceito ? 'Aceite registrado pelo cliente' : 'Conclusão por você · sem aceite final'}
          </span>
        ) : (
          <div className={styles.progresso} aria-label={`${percentual}% das tarefas concluídas`}>
            <span>
              {projeto.feitas} de {projeto.total} tarefas
            </span>
            <div className={styles.barra} aria-hidden="true">
              <span style={{ transform: `scaleX(${percentual / 100})` }} />
            </div>
            <strong>{percentual}%</strong>
          </div>
        )}
      </div>
    </header>
  );
}
