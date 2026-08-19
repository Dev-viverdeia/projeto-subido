import Link from 'next/link';
import { CalendarCheck2, Check, ExternalLink, Link2, ShieldCheck } from 'lucide-react';
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
      <div className={styles.setupVisual} aria-hidden="true">
        <span className={styles.setupOrbita} />
        <span className={styles.setupIcone}>
          <CalendarCheck2 size={28} strokeWidth={1.5} />
        </span>
        <span className={styles.setupSelo}>
          <Link2 size={13} strokeWidth={2} />
          Uma conexão
        </span>
      </div>

      <div className={styles.setupConteudo}>
        <p className={styles.sobretitulo}>Antes do primeiro agendamento</p>
        <h3 id="setup-calendar-titulo">
          {indisponivel
            ? 'A conexão com o Google está sendo ativada.'
            : reconectar
              ? 'Reconecte seu Google Calendar.'
              : 'Autorize o Google Calendar.'}
        </h3>
        <p>
          {indisponivel
            ? 'O agendamento fica bloqueado até essa configuração estar disponível e você conectar sua conta.'
            : 'A Subido cria o evento na sua agenda, convida o cliente e coloca o link da sala da plataforma no convite.'}
        </p>

        <ol className={styles.setupEtapas}>
          <li>
            <span>
              <Check size={13} strokeWidth={2.2} aria-hidden="true" />
            </span>
            Você escolhe a conta Google
          </li>
          <li>
            <span>
              <Check size={13} strokeWidth={2.2} aria-hidden="true" />
            </span>
            Autoriza a criação dos seus eventos
          </li>
          <li>
            <span>
              <Check size={13} strokeWidth={2.2} aria-hidden="true" />
            </span>
            Volta direto para este agendamento
          </li>
        </ol>

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
