import Link from 'next/link';
import { ArrowUpRight, CalendarClock, History, Video } from 'lucide-react';
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
  return callPodeAbrir(call.status) ? `/sala/${call.codigoPublico}` : `/calls/${call.id}`;
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
      href: compromisso.reuniaoId ? `/calls/${compromisso.reuniaoId}` : null,
      acao: compromisso.reuniaoId ? 'Abrir call' : null,
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
      titulo: `Abra uma nova oportunidade quando houver outro projeto para vender a ${lead.empresa.nome}.`,
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
          ? 'Revise a call e monte uma proposta com o que foi confirmado.'
          : `Prepare ${call.titulo}`,
      href:
        call.status === 'concluida'
          ? `/propostas/nova?oportunidade=${lead.oportunidade.id}&reuniao=${call.id}`
          : destinoDaCall(call),
      acao: call.status === 'concluida' ? 'Montar proposta' : 'Abrir call',
      prazo: lead.oportunidade.proximaAcaoEm ?? call.agendadaPara,
    };
  }

  return {
    tipo: 'navegacao',
    rotulo: 'Próxima ação recomendada',
    titulo:
      lead.oportunidade.proximaAcao ??
      'Agende uma conversa para entender o problema e a prioridade.',
    href: `/calls?nova=1&oportunidade=${lead.oportunidade.id}`,
    acao: 'Agendar call',
    prazo: lead.oportunidade.proximaAcaoEm,
  };
}

export function ResumoOperacionalLead({ lead }: { lead: DossieLead }) {
  const movimento = proximoMovimento(lead);
  const faseAtual = faseDaEtapa(lead.oportunidade.etapa);
  const indiceAtual = FASES_CRM.findIndex((fase) => fase.id === faseAtual);
  const fasesVenda = FASES_CRM.filter((fase) => fase.id !== 'desfecho');
  const encerrada = faseAtual === 'desfecho';

  return (
    <section className={styles.operacao} aria-labelledby="operacao-titulo">
      <header className={styles.topo}>
        <div>
          <p className={styles.sobretitulo}>Método de venda</p>
          <h2 id="operacao-titulo">Próximo passo da venda</h2>
          <p>Veja a etapa atual e execute a ação recomendada para esta oportunidade.</p>
        </div>

        <ol className={styles.metodo} aria-label="Etapas da venda">
          {fasesVenda.map((fase, indice) => {
            const estado =
              encerrada || indice < indiceAtual
                ? 'concluida'
                : indice === indiceAtual
                  ? 'atual'
                  : 'futura';
            return (
              <li
                key={fase.id}
                data-estado={estado}
                aria-current={estado === 'atual' ? 'step' : undefined}
              >
                <span>{String(indice + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{fase.rotulo}</strong>
                  <small>{fase.descricao}</small>
                </div>
              </li>
            );
          })}
        </ol>
      </header>

      <div className={styles.decisao}>
        <div className={styles.decisaoTexto}>
          <span className={styles.iconeDecisao}>
            <CalendarClock size={19} strokeWidth={1.7} aria-hidden="true" />
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
          {!encerrada && (
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
          <span>Ver histórico da oportunidade</span>
          <small>
            {lead.eventos.length} {lead.eventos.length === 1 ? 'atividade' : 'atividades'} ·{' '}
            {lead.totalCalls} {lead.totalCalls === 1 ? 'call' : 'calls'}
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
                A primeira atividade aparecerá depois de uma ação no CRM.
              </p>
            )}
          </section>

          <section aria-labelledby="calls-titulo">
            <header>
              <div>
                <Video size={17} strokeWidth={1.8} aria-hidden="true" />
                <h3 id="calls-titulo">Calls</h3>
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
              <p className={styles.semDados}>Nenhuma call vinculada a esta oportunidade.</p>
            )}
          </section>
        </div>
      </details>
    </section>
  );
}
