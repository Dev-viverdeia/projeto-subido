import Link from 'next/link';
import { CalendarClock, CalendarX2, CheckCircle2 } from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { ConviteCall } from '@/lib/calls/queries';
import styles from './sala.module.css';

export function EstadoFinalSala({
  convite,
  anfitriao,
  passouDaJanela,
  horario,
}: {
  convite: Pick<ConviteCall, 'status' | 'titulo' | 'agendadaPara' | 'reuniaoId'>;
  anfitriao: boolean;
  passouDaJanela: boolean;
  horario: string;
}) {
  const cancelada = convite.status === 'cancelada';
  const precisaNovoHorario = cancelada || passouDaJanela;

  return (
    <main className={styles.pagina} data-encerrada>
      <div className={styles.marca}>
        <SubidoLogo size={18} />
      </div>
      <section className={styles.terminal} aria-labelledby="sala-encerrada-titulo">
        <span className={styles.terminalIcone} aria-hidden="true">
          {cancelada ? (
            <CalendarX2 size={28} />
          ) : passouDaJanela ? (
            <CalendarClock size={28} />
          ) : (
            <CheckCircle2 size={28} />
          )}
        </span>
        <h1 id="sala-encerrada-titulo">
          {cancelada
            ? 'Reunião cancelada'
            : passouDaJanela
              ? 'Horário encerrado'
              : 'Reunião encerrada'}
        </h1>
        <p className={styles.terminalReuniao}>{convite.titulo}</p>
        <time dateTime={convite.agendadaPara}>{horario}</time>
        <p className={styles.terminalOrientacao}>
          {precisaNovoHorario
            ? anfitriao
              ? 'Abra sua agenda para combinar um novo horário.'
              : 'Peça um novo horário ao organizador.'
            : anfitriao
              ? 'Acompanhe o registro desta conversa em Reuniões.'
              : 'Você já pode fechar esta página.'}
        </p>
        {anfitriao && (
          <Link
            href={precisaNovoHorario ? '/reunioes' : `/reunioes/${convite.reuniaoId}`}
            className="via-btn via-btn--primary via-btn--md"
          >
            {precisaNovoHorario ? 'Voltar às reuniões' : 'Ver reunião'}
          </Link>
        )}
      </section>
    </main>
  );
}
