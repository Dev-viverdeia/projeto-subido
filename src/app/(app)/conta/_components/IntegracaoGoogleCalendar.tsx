import Link from 'next/link';
import { CalendarCheck2, CalendarClock, ExternalLink, Unplug } from 'lucide-react';
import { desconectarGoogleCalendar } from '@/lib/google-calendar/actions';
import type { EstadoGoogleCalendar } from '@/lib/google-calendar/queries';
import styles from '../page.module.css';

export function IntegracaoGoogleCalendar({ calendar }: { calendar: EstadoGoogleCalendar }) {
  const precisaReconectar = calendar.status === 'reconectar' || calendar.status === 'erro';

  return (
    <section
      className={`${styles.cartao} ${styles.integracaoCalendar}`}
      aria-labelledby="integracao-google-calendar"
    >
      <header className={styles.cabecalhoCartao}>
        <span aria-hidden="true">
          {calendar.conectado ? (
            <CalendarCheck2 size={18} strokeWidth={1.7} />
          ) : (
            <CalendarClock size={18} strokeWidth={1.7} />
          )}
        </span>
        <div>
          <p>Integrações</p>
          <h2 id="integracao-google-calendar">Google Calendar</h2>
        </div>
      </header>

      <div className={styles.integracaoCorpo}>
        <div>
          <strong>
            {calendar.conectado
              ? 'Calendário conectado'
              : precisaReconectar
                ? 'Reconecte para voltar a enviar convites'
                : 'Envie convites sem sair da Subido'}
          </strong>
          <p>
            {calendar.conectado
              ? `As novas calls podem entrar na agenda ${calendar.email ?? ''} e convidar o cliente automaticamente.`
              : 'O Google cuida do evento e do convite. O acesso da reunião continua sendo a sala pública da Subido.'}
          </p>
          {calendar.ultimoErro && <small>{calendar.ultimoErro}</small>}
        </div>

        <div className={styles.integracaoAcoes}>
          {calendar.configurado && !calendar.conectado && (
            <Link
              href="/api/integracoes/google-calendar/conectar?retorno=%2Fconta"
              className="via-btn via-btn--primary via-btn--md"
            >
              {precisaReconectar ? 'Reconectar calendário' : 'Conectar Google Calendar'}
              <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          )}
          {calendar.conectado && (
            <form action={desconectarGoogleCalendar}>
              <button type="submit" className="via-btn via-btn--secondary via-btn--md">
                <Unplug size={15} strokeWidth={1.8} aria-hidden="true" />
                Desconectar
              </button>
            </form>
          )}
          {!calendar.configurado && (
            <span className={styles.integracaoPreparando}>Integração em configuração</span>
          )}
        </div>
      </div>
    </section>
  );
}
