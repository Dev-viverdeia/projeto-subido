import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { reenviarConviteGoogle } from '@/lib/calls/actions';
import type { ReuniaoCall } from '@/lib/calls/queries';
import type { EstadoGoogleCalendar } from '@/lib/google-calendar/queries';
import { AcoesSala } from './AcoesSala';
import styles from '../pagina.module.css';

const DATA_LONGA = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  timeZone: 'America/Sao_Paulo',
});
const HORA = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

export function CallRecemAgendada({
  reuniao,
  calendar,
  comercialLiberado = true,
}: {
  reuniao: ReuniaoCall;
  calendar?: EstadoGoogleCalendar;
  comercialLiberado?: boolean;
}) {
  const conviteSincronizado = reuniao.googleSyncStatus === 'sincronizado';
  const conviteFalhou = reuniao.googleSyncStatus === 'falhou';

  return (
    <section className={styles.callCriada} aria-labelledby="call-criada-titulo" aria-live="polite">
      <div className={styles.callCriadaContexto}>
        <p>Reunião pronta</p>
        <h2 id="call-criada-titulo">{reuniao.titulo}</h2>
        <span>
          {reuniao.empresa}
          {reuniao.contato ? ` · ${reuniao.contato}` : ''}
        </span>
      </div>

      <dl className={styles.callCriadaDados}>
        <div>
          <dt>Quando</dt>
          <dd>
            {DATA_LONGA.format(new Date(reuniao.agendadaPara))} ·{' '}
            {HORA.format(new Date(reuniao.agendadaPara))}
          </dd>
        </div>
        <div>
          <dt>Venda</dt>
          <dd>{reuniao.oportunidade}</dd>
        </div>
        <div>
          <dt>Memória</dt>
          <dd>{reuniao.liveCoachAtivo ? 'Transcrição + Live Coach' : 'Transcrição da conversa'}</dd>
        </div>
      </dl>

      <div className={styles.callCriadaAcoes}>
        <p>
          {conviteSincronizado
            ? `Convite enviado pelo Google Calendar${reuniao.convidadoEmail ? ` para ${reuniao.convidadoEmail}` : ''}.`
            : conviteFalhou
              ? 'A sala foi criada, mas o convite do Google não foi enviado.'
              : comercialLiberado
                ? 'O link foi criado e a reunião já aparece na ficha do cliente.'
                : 'O link foi criado e o histórico desta conversa ficará salvo.'}
        </p>
        <div>
          <AcoesSala id={reuniao.id} codigo={reuniao.codigoPublico} />
          {comercialLiberado && (
            <Link href={`/vendas/${reuniao.oportunidadeId}`} className={styles.abrirLead}>
              Abrir ficha <ArrowRight size={14} aria-hidden="true" />
            </Link>
          )}
          {conviteSincronizado && reuniao.googleEventUrl && (
            <a
              href={reuniao.googleEventUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.abrirLead}
            >
              Ver no Calendar <ExternalLink size={13} aria-hidden="true" />
            </a>
          )}
          {conviteFalhou && calendar?.conectado && reuniao.convidadoEmail && (
            <form action={reenviarConviteGoogle}>
              <input type="hidden" name="reuniao" value={reuniao.id} />
              <button type="submit" className={styles.abrirLead}>
                Tentar enviar de novo
              </button>
            </form>
          )}
          {conviteFalhou && !calendar?.conectado && (
            <Link
              href={`/api/integracoes/google-calendar/conectar?retorno=${encodeURIComponent(`/reunioes?agendada=${reuniao.id}`)}`}
              className={styles.abrirLead}
            >
              Reconectar calendário <ExternalLink size={13} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
