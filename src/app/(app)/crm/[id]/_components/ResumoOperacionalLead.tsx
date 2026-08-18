import Link from 'next/link';
import { ArrowUpRight, History, ListChecks, Video } from 'lucide-react';
import { callPodeAbrir, ROTULO_STATUS_CALL, ROTULO_TIPO_CALL } from '@/lib/calls/tipos';
import { montarCicloCliente } from '@/lib/crm/ciclo-cliente';
import type { DossieLead } from '@/lib/crm/queries';
import { BotaoNovoCiclo } from './BotaoNovoCiclo';
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

export function ResumoOperacionalLead({ lead }: { lead: DossieLead }) {
  const compromisso = lead.acoesPlano[0] ?? null;
  const { etapas, decisao } = montarCicloCliente(lead);

  return (
    <section className={styles.operacao} aria-labelledby="operacao-titulo">
      <header className={styles.operacaoTopo}>
        <div>
          <p className={styles.sobretitulo}>Oportunidade</p>
          <h2 id="operacao-titulo">Histórico e próxima ação</h2>
          <p>Calls, propostas e projetos ligados a este cliente.</p>
        </div>
        {decisao.novoCiclo ? (
          <BotaoNovoCiclo oportunidadeId={lead.oportunidade.id} />
        ) : (
          decisao.href && (
            <Link href={decisao.href} className={styles.agendarCall}>
              {decisao.acao}
              <ArrowUpRight size={15} strokeWidth={1.9} aria-hidden="true" />
            </Link>
          )
        )}
      </header>

      <ol className={styles.fluxoCliente} aria-label="Etapas desta oportunidade">
        {etapas.map((etapa) => {
          const conteudo = (
            <>
              <span className={styles.fluxoNumero}>{etapa.numero}</span>
              <span className={styles.fluxoTexto}>
                <small>{etapa.rotulo}</small>
                <strong>{etapa.estado}</strong>
              </span>
            </>
          );

          return (
            <li
              key={etapa.id}
              data-atual={etapa.atual || undefined}
              data-comprovada={etapa.comprovada || undefined}
            >
              {etapa.href ? <Link href={etapa.href}>{conteudo}</Link> : <div>{conteudo}</div>}
            </li>
          );
        })}
      </ol>

      <div className={styles.gradeOperacao}>
        <article className={styles.agora}>
          <div className={styles.agoraRotulo}>
            <ListChecks size={17} strokeWidth={1.8} aria-hidden="true" />
            <span>{decisao.rotulo}</span>
          </div>
          <h3>{decisao.titulo}</h3>
          {(compromisso?.prazoEm ?? lead.oportunidade.proximaAcaoEm) && (
            <time dateTime={compromisso?.prazoEm ?? lead.oportunidade.proximaAcaoEm ?? undefined}>
              Combinado para{' '}
              {DATA_CURTA.format(
                new Date(compromisso?.prazoEm ?? lead.oportunidade.proximaAcaoEm ?? ''),
              )}
            </time>
          )}
          {decisao.apoioHref ? (
            <Link href={decisao.apoioHref}>
              {decisao.apoioRotulo}
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          ) : (
            decisao.href && (
              <Link href={decisao.href}>
                {decisao.acao}
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
            <span>{lead.eventos.length} atividades</span>
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
            <p className={styles.semHistorico}>
              As atividades aparecerão depois da primeira ação no CRM.
            </p>
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
            <p className={styles.semHistorico}>Nenhuma call vinculada a esta oportunidade.</p>
          )}
        </section>
      </div>
    </section>
  );
}
