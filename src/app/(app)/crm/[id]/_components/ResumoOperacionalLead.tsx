import Link from 'next/link';
import { ArrowUpRight, CalendarPlus, History, ListChecks, Video } from 'lucide-react';
import { callPodeAbrir, ROTULO_STATUS_CALL, ROTULO_TIPO_CALL } from '@/lib/calls/tipos';
import type { DossieLead } from '@/lib/crm/queries';
import styles from '../pagina.module.css';

const DATA_CURTA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
});

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

function destinoDaCall(call: DossieLead['calls'][number]) {
  return callPodeAbrir(call.status) ? `/sala/${call.codigoPublico}` : `/calls/${call.id}`;
}

function rotuloDaCall(call: DossieLead['calls'][number]) {
  if (call.status === 'concluida') return 'Revisar pós-call';
  if (call.status === 'processando') return 'Acompanhar leitura';
  if (call.status === 'cancelada') return 'Ver registro';
  return 'Abrir sala';
}

export function ResumoOperacionalLead({ lead }: { lead: DossieLead }) {
  const callRecente = lead.calls[0] ?? null;
  const compromisso = lead.acoesPlano[0] ?? null;
  const proximaAcao =
    compromisso?.titulo ??
    lead.oportunidade.proximaAcao ??
    (callRecente?.status === 'concluida'
      ? 'Revisar a última call e confirmar o próximo movimento.'
      : 'Preparar a próxima conversa com o contexto já registrado.');

  return (
    <section className={styles.operacao} aria-labelledby="operacao-titulo">
      <header className={styles.operacaoTopo}>
        <div>
          <p className={styles.sobretitulo}>Contexto vivo</p>
          <h2 id="operacao-titulo">O que aconteceu e o que vem agora</h2>
          <p>Fatos, calls e próxima ação no mesmo lugar — sem reconstruir a história do lead.</p>
        </div>
        <Link
          href={`/calls?nova=1&oportunidade=${lead.oportunidade.id}`}
          className={styles.agendarCall}
        >
          <CalendarPlus size={16} strokeWidth={1.8} aria-hidden="true" />
          Agendar call
        </Link>
      </header>

      <div className={styles.gradeOperacao}>
        <article className={styles.agora}>
          <div className={styles.agoraRotulo}>
            <ListChecks size={17} strokeWidth={1.8} aria-hidden="true" />
            <span>{compromisso ? 'Plano do cliente' : 'Próximo movimento'}</span>
          </div>
          <h3>{proximaAcao}</h3>
          {(compromisso?.prazoEm ?? lead.oportunidade.proximaAcaoEm) && (
            <time dateTime={compromisso?.prazoEm ?? lead.oportunidade.proximaAcaoEm ?? undefined}>
              Combinado para{' '}
              {DATA_CURTA.format(
                new Date(compromisso?.prazoEm ?? lead.oportunidade.proximaAcaoEm ?? ''),
              )}
            </time>
          )}
          {lead.projetoAtivo ? (
            <Link href={`/solucoes/execucao/${lead.projetoAtivo.id}`}>
              Abrir sala de entrega
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          ) : (
            callRecente && (
              <Link href={destinoDaCall(callRecente)}>
                {rotuloDaCall(callRecente)}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            )
          )}
        </article>

        <section className={styles.historico} aria-labelledby="historico-titulo">
          <header>
            <div>
              <History size={17} strokeWidth={1.8} aria-hidden="true" />
              <h3 id="historico-titulo">Linha do tempo</h3>
            </div>
            <span>{lead.eventos.length} fatos</span>
          </header>
          {lead.eventos.length ? (
            <ol>
              {lead.eventos.slice(0, 5).map((evento) => (
                <li key={evento.id}>
                  <time dateTime={evento.ocorridoEm}>
                    {DATA_CURTA.format(new Date(evento.ocorridoEm))}
                  </time>
                  <div>
                    <strong>{evento.titulo}</strong>
                    {evento.descricao && <p>{evento.descricao}</p>}
                    <small>{evento.fonte}</small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.semHistorico}>O primeiro fato aparecerá após uma ação no CRM.</p>
          )}
        </section>

        <section className={styles.callsVinculadas} aria-labelledby="calls-vinculadas-titulo">
          <header>
            <div>
              <Video size={17} strokeWidth={1.8} aria-hidden="true" />
              <h3 id="calls-vinculadas-titulo">Calls vinculadas</h3>
            </div>
            <span>{lead.totalCalls}</span>
          </header>
          {lead.calls.length ? (
            <ul>
              {lead.calls.slice(0, 3).map((call) => (
                <li key={call.id}>
                  <Link href={destinoDaCall(call)}>
                    <span>
                      <strong>{call.titulo}</strong>
                      <small>
                        {ROTULO_TIPO_CALL[call.tipo]} ·{' '}
                        {DATA_HORA.format(new Date(call.agendadaPara))}
                      </small>
                    </span>
                    <span>{ROTULO_STATUS_CALL[call.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.semHistorico}>Nenhuma conversa vinculada a este lead.</p>
          )}
        </section>
      </div>
    </section>
  );
}
