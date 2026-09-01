import Link from 'next/link';
import { CalendarCheck2, ExternalLink, ShieldCheck } from 'lucide-react';
import { Alert, Button } from '@/design-system/via';
import type { EstadoGoogleCalendar } from '@/lib/google-calendar/queries';
import styles from './FormularioAgendarCall.module.css';

export function SetupGoogleCalendar({
  calendar,
  conectarHref,
  aoFechar,
}: {
  calendar: EstadoGoogleCalendar;
  conectarHref: string;
  aoFechar: () => void;
}) {
  const reconectar = calendar.status === 'reconectar';
  const indisponivel = !calendar.configurado;

  return (
    <section className={styles.setupCalendar} aria-labelledby="setup-calendar-titulo">
      <span className={styles.setupIcone} aria-hidden="true">
        <CalendarCheck2 size={24} strokeWidth={1.6} />
      </span>
      <div className={styles.setupConteudo}>
        <h3 id="setup-calendar-titulo">
          {indisponivel
            ? 'Conexão temporariamente indisponível'
            : reconectar
              ? 'Reconecte sua agenda'
              : 'Uma conexão para todos os próximos convites'}
        </h3>
        <p>
          {indisponivel
            ? 'O agendamento será liberado assim que a integração estiver ativa.'
            : 'A Subido cria o evento, convida o cliente e inclui o link da sala da plataforma.'}
        </p>

        {!indisponivel && (
          <div className={styles.setupResumo}>
            <strong>Evento, convite e sala em uma única ação.</strong>
            <span>Você escolhe a conta Google e volta direto para este agendamento.</span>
          </div>
        )}

        {calendar.ultimoErro && (
          <Alert tone="danger" size="compact">
            {calendar.ultimoErro}
          </Alert>
        )}

        <div className={styles.setupAcoes}>
          <Button type="button" variant="secondary" onClick={aoFechar}>
            Agora não
          </Button>
          {indisponivel ? (
            <Button type="button" disabled data-autofocus>
              Conexão indisponível
            </Button>
          ) : (
            <Link
              href={conectarHref}
              className="via-btn via-btn--primary via-btn--md"
              data-autofocus
            >
              {reconectar ? 'Reconectar Google Calendar' : 'Conectar Google Calendar'}
              <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          )}
        </div>

        <small className={styles.setupPrivacidade}>
          <ShieldCheck size={14} strokeWidth={1.8} aria-hidden="true" />A plataforma solicita
          somente o acesso necessário para criar e atualizar os eventos que você organiza.
        </small>
      </div>
    </section>
  );
}
