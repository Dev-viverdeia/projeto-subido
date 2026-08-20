import Link from 'next/link';
import { ArrowUpRight, CalendarClock, Check, CheckCircle2, History, Video, X } from 'lucide-react';
import { callPodeAbrir, ROTULO_STATUS_CALL, ROTULO_TIPO_CALL } from '@/lib/calls/tipos';
import { FASES_CRM, faseDaEtapa } from '@/lib/crm/etapas';
import type { DossieLead } from '@/lib/crm/queries';
import { BotaoNovoCiclo } from './BotaoNovoCiclo';
import { EditarProximaAcao } from './EditarProximaAcao';
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

type Movimento = {
  tipo: 'navegacao' | 'encerrado' | 'novo-ciclo';
  rotulo: string;
  titulo: string;
  href: string | null;
  acao: string | null;
  prazo: string | null;
};

function proximoMovimento(lead: DossieLead): Movimento {
  const compromisso = lead.acoesPlano[0] ?? null;
  const proposta = lead.propostaRecente;
  const call = lead.calls[0] ?? null;

  if (compromisso) {
    return {
      tipo: 'navegacao',
      rotulo: 'Compromisso marcado',
      titulo: compromisso.titulo,
      href: compromisso.reuniaoId ? `/reunioes/${compromisso.reuniaoId}` : null,
      acao: compromisso.reuniaoId ? 'Abrir reunião' : null,
      prazo: compromisso.prazoEm,
    };
  }

  if (lead.projetoAtivo) {
    return {
      tipo: 'navegacao',
      rotulo: 'Entrega em andamento',
      titulo: `Continue ${lead.projetoAtivo.titulo}.`,
      href: `/solucoes/execucao/${lead.projetoAtivo.id}`,
      acao: 'Abrir projeto',
      prazo: null,
    };
  }

  if (lead.projetoRecente?.status === 'concluido' || lead.oportunidade.etapa === 'ganho') {
    return {
      tipo: 'novo-ciclo',
      rotulo: 'Ciclo concluído',
      titulo: `Inicie uma nova venda quando houver outro projeto para oferecer a ${lead.empresa.nome}.`,
      href: null,
      acao: null,
      prazo: null,
    };
  }

  if (lead.oportunidade.etapa === 'perdido') {
    return {
      tipo: 'encerrado',
      rotulo: 'Venda encerrada',
      titulo: 'O motivo da perda fica salvo para orientar uma abordagem futura.',
      href: null,
      acao: null,
      prazo: null,
    };
  }

  if (proposta) {
    return {
      tipo: 'navegacao',
      rotulo: proposta.status === 'aceita' ? 'Proposta aceita' : 'Decisão comercial',
      titulo:
        proposta.status === 'aceita'
          ? 'Confirme o início do projeto com o cliente.'
          : `Continuar ${proposta.titulo}`,
      href: `/propostas/${proposta.id}`,
      acao: proposta.status === 'aceita' ? 'Abrir proposta aceita' : 'Continuar proposta',
      prazo: lead.oportunidade.proximaAcaoEm,
    };
  }

  if (call) {
    return {
      tipo: 'navegacao',
      rotulo: call.status === 'concluida' ? 'Depois da conversa' : 'Próxima conversa',
      titulo:
        call.status === 'concluida'
          ? 'Revise a reunião e monte uma proposta com o que foi confirmado.'
          : `Prepare ${call.titulo}`,
      href:
        call.status === 'concluida'
          ? `/propostas/nova?oportunidade=${lead.oportunidade.id}&reuniao=${call.id}`
          : destinoDaCall(call),
      acao: call.status === 'concluida' ? 'Montar proposta' : 'Abrir reunião',
      prazo: lead.oportunidade.proximaAcaoEm ?? call.agendadaPara,
    };
  }

  return {
    tipo: 'navegacao',
    rotulo: 'Próxima ação recomendada',
    titulo:
      lead.oportunidade.proximaAcao ??
      'Agende uma conversa para entender o problema e a prioridade.',
    href: `/reunioes?nova=1&oportunidade=${lead.oportunidade.id}`,
    acao: 'Agendar reunião',
    prazo: lead.oportunidade.proximaAcaoEm,
  };
}

export function ResumoOperacionalLead({ lead }: { lead: DossieLead }) {
  const movimento = proximoMovimento(lead);
  const faseAtual = faseDaEtapa(lead.oportunidade.etapa);
  const indiceAtual = FASES_CRM.findIndex((fase) => fase.id === faseAtual);
  const fasesVenda = FASES_CRM.filter((fase) => fase.id !== 'desfecho');
  const ganha = lead.oportunidade.etapa === 'ganho';
  const perdida = lead.oportunidade.etapa === 'perdido';
  const ultimaFasePercorrida = lead.propostaRecente ? 2 : lead.calls.length > 0 ? 1 : 0;
  const IconeDecisao = ganha ? CheckCircle2 : perdida ? X : CalendarClock;
  const tituloSecao = ganha
    ? 'Venda concluída'
    : perdida
      ? 'Venda encerrada'
      : 'Próximo passo da venda';
  const descricaoSecao = ganha
    ? 'O projeto foi aprovado. O histórico comercial continua salvo nesta ficha.'
    : perdida
      ? 'A venda foi encerrada. As etapas realizadas e o motivo da perda continuam salvos.'
      : 'Veja a etapa atual e execute a ação recomendada para este cliente.';

  return (
    <section className={styles.operacao} aria-labelledby="operacao-titulo">
      <header className={styles.topo}>
        <div>
          <p className={styles.sobretitulo}>Método de venda</p>
          <h2 id="operacao-titulo">{tituloSecao}</h2>
          <p>{descricaoSecao}</p>
        </div>

        <ol className={styles.metodo} aria-label="Etapas da venda">
          {fasesVenda.map((fase, indice) => {
            const estado = ganha
              ? 'concluida'
              : perdida
                ? indice < ultimaFasePercorrida
                  ? 'concluida'
                  : indice === ultimaFasePercorrida
                    ? 'encerrada'
                    : 'futura'
                : indice < indiceAtual
                  ? 'concluida'
                  : indice === indiceAtual
                    ? 'atual'
                    : 'futura';
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
                key={fase.id}
                data-estado={estado}
                aria-current={estado === 'atual' ? 'step' : undefined}
              >
                <span className={styles.marcadorEtapa} aria-hidden="true">
                  {estado === 'concluida' ? (
                    <Check size={14} strokeWidth={2.6} />
                  ) : estado === 'encerrada' ? (
                    <X size={14} strokeWidth={2.4} />
                  ) : (
                    String(indice + 1).padStart(2, '0')
                  )}
                </span>
                <div>
                  <strong>{fase.rotulo}</strong>
                  <small className={styles.estadoEtapa}>{rotuloEstado}</small>
                  <small className={styles.descricaoEtapa}>{fase.descricao}</small>
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
          {movimento.tipo === 'novo-ciclo' ? (
            <BotaoNovoCiclo oportunidadeId={lead.oportunidade.id} />
          ) : movimento.href && movimento.acao ? (
            <Link href={movimento.href} className={styles.acaoPrimaria}>
              {movimento.acao}
              <ArrowUpRight size={15} strokeWidth={1.9} aria-hidden="true" />
            </Link>
          ) : null}
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
