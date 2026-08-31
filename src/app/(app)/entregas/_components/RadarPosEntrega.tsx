import Link from 'next/link';
import { ArrowUpRight, CalendarCheck2, CalendarClock, ClockAlert } from 'lucide-react';
import type { ResumoProjetoExecucao } from '@/lib/projetos-execucao/queries';
import {
  classificarRevisaoEvolucao,
  ordenarRevisoesEvolucao,
} from '@/lib/projetos-execucao/radar-evolucao';
import styles from './RadarPosEntrega.module.css';

function formatarData(valor: string): { dia: string; mes: string; completa: string } {
  const data = new Date(`${valor}T12:00:00-03:00`);
  const dia = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(data);
  const mes = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  })
    .format(data)
    .replace('.', '');
  const completa = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  })
    .format(data)
    .replace('.', '');
  return { dia, mes, completa };
}

export function RadarPosEntrega({
  projetos,
  agora,
}: {
  projetos: ResumoProjetoExecucao[];
  agora: Date;
}) {
  const revisoes = ordenarRevisoesEvolucao(projetos, agora).filter(
    (projeto) => projeto.evolucao?.status === 'agendada',
  );
  if (!revisoes.length) return null;

  const sinais = revisoes.map((projeto) => classificarRevisaoEvolucao(projeto.evolucao!, agora));
  const atrasadas = sinais.filter((sinal) => sinal.status === 'vencida').length;
  const proximas = sinais.filter(
    (sinal) => sinal.status === 'hoje' || sinal.status === 'proxima',
  ).length;
  const futuras = sinais.filter((sinal) => sinal.status === 'agendada').length;
  const urgentes = revisoes.filter(
    (projeto) => classificarRevisaoEvolucao(projeto.evolucao!, agora).status !== 'agendada',
  );
  const emFoco = urgentes.length ? urgentes : revisoes.slice(0, 2);

  const titulo = atrasadas
    ? `${atrasadas} ${atrasadas === 1 ? 'revisão pede' : 'revisões pedem'} atenção agora.`
    : proximas
      ? 'As próximas revisões já estão na agenda.'
      : 'O pós-entrega está organizado.';

  return (
    <section className={styles.radar} aria-labelledby="radar-pos-entrega-titulo">
      <div className={styles.contexto}>
        <span className={styles.icone} aria-hidden="true">
          <CalendarClock size={22} strokeWidth={1.65} />
        </span>
        <div>
          <p className={styles.eyebrow}>Depois da entrega</p>
          <h2 id="radar-pos-entrega-titulo">{titulo}</h2>
          <p className={styles.descricao}>
            Confira o que mudou para o cliente e transforme o resultado em uma decisão clara.
          </p>
        </div>

        <dl className={styles.contadores} aria-label="Resumo das revisões de resultado">
          <div data-ativo={atrasadas > 0 || undefined}>
            <dt>Atrasadas</dt>
            <dd>{atrasadas}</dd>
          </div>
          <div data-ativo={proximas > 0 || undefined}>
            <dt>Próximos 7 dias</dt>
            <dd>{proximas}</dd>
          </div>
          <div>
            <dt>Mais adiante</dt>
            <dd>{futuras}</dd>
          </div>
        </dl>
      </div>

      <ol className={styles.lista}>
        {emFoco.map((projeto) => {
          const evolucao = projeto.evolucao!;
          const sinal = classificarRevisaoEvolucao(evolucao, agora);
          const data = formatarData(evolucao.revisaoEm);
          const Icone = sinal.status === 'vencida' ? ClockAlert : CalendarCheck2;

          return (
            <li key={projeto.id} data-status={sinal.status}>
              <Link
                href={`/entregas/${projeto.id}`}
                aria-label={`Abrir revisão de ${projeto.empresa}`}
              >
                <time className={styles.data} dateTime={evolucao.revisaoEm}>
                  <strong>{data.dia}</strong>
                  <span>{data.mes}</span>
                </time>
                <div className={styles.cliente}>
                  <small>{projeto.empresa}</small>
                  <strong>{projeto.titulo}</strong>
                  <span>{sinal.detalhe}</span>
                </div>
                <span className={styles.sinal} data-status={sinal.status}>
                  <Icone size={15} strokeWidth={1.7} aria-hidden="true" />
                  {sinal.rotulo}
                </span>
                <span className={styles.acao}>
                  {sinal.status === 'vencida' || sinal.status === 'hoje'
                    ? 'Registrar resultado'
                    : 'Preparar revisão'}
                  <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {revisoes.length > emFoco.length && (
        <p className={styles.nota}>
          Outras {revisoes.length - emFoco.length}{' '}
          {revisoes.length - emFoco.length === 1 ? 'revisão está' : 'revisões estão'} identificadas
          no histórico abaixo.
        </p>
      )}
    </section>
  );
}
