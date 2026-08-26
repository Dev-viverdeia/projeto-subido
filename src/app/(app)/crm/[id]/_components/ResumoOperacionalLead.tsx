import Link from 'next/link';
import { ArrowUpRight, CalendarClock, Check, CheckCircle2, History, Video, X } from 'lucide-react';
import { callPodeAbrir, ROTULO_STATUS_CALL, ROTULO_TIPO_CALL } from '@/lib/calls/tipos';
import { montarCicloCliente } from '@/lib/crm/ciclo-cliente';
import type { DossieLead } from '@/lib/crm/queries';
import { BotaoNovoCiclo } from './BotaoNovoCiclo';
import { EditarProximaAcao } from './EditarProximaAcao';
import { FormularioEnriquecimento } from './FormularioEnriquecimento';
import styles from './ResumoOperacionalLead.module.css';

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
  return callPodeAbrir(call.status) ? `/sala/${call.codigoPublico}` : `/reunioes/${call.id}`;
}

export function ResumoOperacionalLead({ lead }: { lead: DossieLead }) {
  const { etapas, decisao: movimento } = montarCicloCliente(lead);
  const ganha = lead.oportunidade.etapa === 'ganho';
  const perdida = lead.oportunidade.etapa === 'perdido';
  const cicloConcluido = lead.projetoRecente?.status === 'concluido';
  const IconeDecisao = ganha ? CheckCircle2 : perdida ? X : CalendarClock;
  const tituloSecao = cicloConcluido
    ? 'Ciclo concluído'
    : ganha
      ? 'Cliente em entrega'
      : perdida
        ? 'Venda encerrada'
        : 'Jornada do cliente';
  const descricaoSecao = cicloConcluido
    ? 'A venda e a entrega ficam conectadas nesta ficha para você repetir o que funcionou.'
    : ganha
      ? 'A venda foi aprovada. Continue o projeto até a entrega ser aceita pelo cliente.'
      : perdida
        ? 'A venda foi encerrada. As etapas realizadas e o motivo da perda continuam salvos.'
        : 'Um caminho simples, sempre guiado pelos fatos registrados nesta ficha.';

  return (
    <section className={styles.operacao} aria-labelledby="operacao-titulo">
      <header className={styles.topo}>
        <div>
          <p className={styles.sobretitulo}>Método de venda e entrega</p>
          <h2 id="operacao-titulo">{tituloSecao}</h2>
          <p>{descricaoSecao}</p>
        </div>

        <ol className={styles.metodo} aria-label="Jornada deste cliente">
          {etapas.map((etapa) => {
            const estado = etapa.estado;
            const rotuloEstado =
              estado === 'concluida'
                ? 'Concluída'
                : estado === 'atual'
                  ? 'Em andamento'
                  : estado === 'encerrada'
                    ? 'Encerrada aqui'
                    : 'Próxima etapa';
            return (
              <li
                key={etapa.id}
                data-estado={estado}
                aria-current={estado === 'atual' ? 'step' : undefined}
              >
                <span className={styles.marcadorEtapa} aria-hidden="true">
                  {estado === 'concluida' ? (
                    <Check size={14} strokeWidth={2.6} />
                  ) : estado === 'encerrada' ? (
                    <X size={14} strokeWidth={2.4} />
                  ) : (
                    etapa.numero
                  )}
                </span>
                <div>
                  <strong>{etapa.rotulo}</strong>
                  <small className={styles.estadoEtapa}>{rotuloEstado}</small>
                  <small className={styles.descricaoEtapa}>{etapa.evidencia}</small>
                </div>
              </li>
            );
          })}
        </ol>
      </header>

      <div
        className={styles.decisao}
        data-resultado={ganha ? 'ganho' : perdida ? 'perdido' : undefined}
      >
        <div className={styles.decisaoTexto}>
          <span className={styles.iconeDecisao}>
            <IconeDecisao size={19} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div>
            <p>{movimento.rotulo}</p>
            <h3>{movimento.titulo}</h3>
            {movimento.prazo && (
              <time dateTime={movimento.prazo}>
                Previsto para {DATA_CURTA.format(new Date(movimento.prazo))}
              </time>
            )}
          </div>
        </div>

        <div className={styles.acoesDecisao}>
          {movimento.tipo === 'enriquecer' ? (
            <FormularioEnriquecimento
              oportunidadeId={lead.oportunidade.id}
              saldoCreditos={lead.saldoCreditos ?? 30}
              temDossie={false}
              rotulo="Enriquecer dados"
              tom="claro"
              desabilitado={
                lead.oportunidade.enriquecimentoStatus === 'na_fila' ||
                lead.oportunidade.enriquecimentoStatus === 'processando'
              }
            />
          ) : movimento.tipo === 'novo-ciclo' ? (
            <BotaoNovoCiclo oportunidadeId={lead.oportunidade.id} />
          ) : movimento.href && movimento.acao ? (
            <Link href={movimento.href} className={styles.acaoPrimaria}>
              {movimento.acao}
              <ArrowUpRight size={15} strokeWidth={1.9} aria-hidden="true" />
            </Link>
          ) : null}
          {movimento.apoioHref && movimento.apoioRotulo && (
            <Link href={movimento.apoioHref} className={styles.acaoSecundaria}>
              {movimento.apoioRotulo}
            </Link>
          )}
          {!ganha && !perdida && (
            <EditarProximaAcao
              oportunidadeId={lead.oportunidade.id}
              acaoAtual={lead.oportunidade.proximaAcao}
              quandoAtual={lead.oportunidade.proximaAcaoEm}
            />
          )}
        </div>
      </div>

      <details className={styles.registrosDetalhes}>
        <summary>
          <span>Ver histórico da venda</span>
          <small>
            {lead.eventos.length} {lead.eventos.length === 1 ? 'atividade' : 'atividades'} ·{' '}
            {lead.totalCalls} {lead.totalCalls === 1 ? 'reunião' : 'reuniões'}
          </small>
        </summary>

        <div className={styles.registros}>
          <section aria-labelledby="historico-titulo">
            <header>
              <div>
                <History size={17} strokeWidth={1.8} aria-hidden="true" />
                <h3 id="historico-titulo">Atividade recente</h3>
              </div>
              <span>{lead.eventos.length}</span>
            </header>
            {lead.eventos.length ? (
              <ol className={styles.listaEventos}>
                {lead.eventos.slice(0, 4).map((evento) => (
                  <li key={evento.id}>
                    <time dateTime={evento.ocorridoEm}>
                      {DATA_CURTA.format(new Date(evento.ocorridoEm))}
                    </time>
                    <div>
                      <strong>{evento.titulo}</strong>
                      {evento.descricao && <p>{evento.descricao}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.semDados}>
                A primeira atividade aparecerá depois de uma ação em Vendas.
              </p>
            )}
          </section>

          <section aria-labelledby="calls-titulo">
            <header>
              <div>
                <Video size={17} strokeWidth={1.8} aria-hidden="true" />
                <h3 id="calls-titulo">Reuniões</h3>
              </div>
              <span>{lead.totalCalls}</span>
            </header>
            {lead.calls.length ? (
              <ul className={styles.listaCalls}>
                {lead.calls.slice(0, 4).map((call) => (
                  <li key={call.id}>
                    <Link href={destinoDaCall(call)}>
                      <div>
                        <strong>{call.titulo}</strong>
                        <small>
                          {ROTULO_TIPO_CALL[call.tipo]} ·{' '}
                          {DATA_HORA.format(new Date(call.agendadaPara))}
                        </small>
                      </div>
                      <span>{ROTULO_STATUS_CALL[call.status]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.semDados}>Nenhuma reunião foi vinculada a esta venda.</p>
            )}
          </section>
        </div>
      </details>
    </section>
  );
}
