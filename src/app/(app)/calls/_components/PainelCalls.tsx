import Link from 'next/link';
import {
  AudioLines,
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CalendarCheck2,
  CalendarX2,
  Clock3,
  ContactRound,
  Database,
  FileAudio,
  Radio,
  Layers3,
} from 'lucide-react';
import { ROTULO_STATUS_CALL, ROTULO_TIPO_CALL, callPodeAbrir } from '@/lib/calls/tipos';
import type { TipoCall } from '@/lib/calls/tipos';
import type { ReuniaoCall } from '@/lib/calls/queries';
import type { OportunidadeSeletor } from '@/lib/crm/queries';
import type { EstadoGoogleCalendar } from '@/lib/google-calendar/queries';
import { AcoesSala } from './AcoesSala';
import { CallRecemAgendada } from './CallRecemAgendada';
import { FormularioAgendarCall } from './FormularioAgendarCall';
import styles from '../pagina.module.css';

const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
});
const HORA = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});
const DATA_LONGA = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  timeZone: 'America/Sao_Paulo',
});

export function PainelCalls({
  reunioes,
  oportunidades,
  calendar,
  agendadaId,
  modalInicial = false,
  oportunidadeInicial,
  tipoInicial,
  calendarResultado,
}: {
  reunioes: ReuniaoCall[];
  oportunidades: OportunidadeSeletor[];
  calendar: EstadoGoogleCalendar;
  agendadaId?: string;
  modalInicial?: boolean;
  oportunidadeInicial?: string;
  tipoInicial?: TipoCall;
  calendarResultado?: 'sincronizado' | 'falhou';
}) {
  const ativas = reunioes.filter((item) => callPodeAbrir(item.status));
  const historico = reunioes
    .filter((item) => !callPodeAbrir(item.status))
    .sort((a, b) => b.agendadaPara.localeCompare(a.agendadaPara));
  const comCoach = ativas.filter((item) => item.liveCoachAtivo).length;
  const recemAgendada = agendadaId ? ativas.find((item) => item.id === agendadaId) : undefined;
  const ativasNaAgenda = recemAgendada
    ? ativas.filter((item) => item.id !== recemAgendada.id)
    : ativas;
  const proxima = ativasNaAgenda[0];
  const seguintes = ativasNaAgenda.slice(1);

  return (
    <div className={styles.pagina}>
      <header className={styles.topo}>
        <div className={styles.introducao}>
          <p className={styles.sobretitulo}>Reuniões</p>
          <h1>Calls</h1>
          <p>Crie a sala, use o Live Coach e salve a transcrição junto ao lead no CRM.</p>
        </div>
        <FormularioAgendarCall
          oportunidades={oportunidades}
          calendar={calendar}
          abertoInicial={modalInicial}
          oportunidadeInicial={oportunidadeInicial}
          tipoInicial={tipoInicial}
        />
      </header>

      {calendarResultado === 'sincronizado' && (
        <div className={styles.confirmacao} role="status">
          <CalendarCheck2 size={17} strokeWidth={1.8} aria-hidden="true" />
          Call criada e convite enviado pelo Google Calendar.
        </div>
      )}
      {calendarResultado === 'falhou' && (
        <div className={styles.confirmacao} data-tom="erro" role="alert">
          <CalendarX2 size={17} strokeWidth={1.8} aria-hidden="true" />A sala foi criada, mas o
          convite não saiu. Reconecte o calendário antes de tentar de novo.
        </div>
      )}

      {recemAgendada ? (
        <CallRecemAgendada reuniao={recemAgendada} calendar={calendar} />
      ) : agendadaId ? (
        <div className={styles.confirmacao} role="status">
          <Layers3 size={17} strokeWidth={1.8} aria-hidden="true" />
          Call criada. Atualize a página para abrir a sala preparada.
        </div>
      ) : null}

      {proxima && (
        <section className={styles.proximaCall} data-on-dark aria-labelledby="proxima-call-titulo">
          <div className={styles.proximaContexto}>
            <div className={styles.proximaLinha}>
              <p>Sua próxima call</p>
              <span data-status={proxima.status}>
                {proxima.status === 'ao_vivo' ? (
                  <Radio size={13} strokeWidth={1.9} aria-hidden="true" />
                ) : (
                  <CalendarDays size={13} strokeWidth={1.9} aria-hidden="true" />
                )}
                {ROTULO_STATUS_CALL[proxima.status]}
              </span>
            </div>
            <h2 id="proxima-call-titulo">{proxima.titulo}</h2>
            <p className={styles.proximaPessoa}>
              <ContactRound size={16} strokeWidth={1.8} aria-hidden="true" />
              {proxima.empresa}
              {proxima.contato ? ` · ${proxima.contato}` : ''}
            </p>
            <div className={styles.proximaRodape}>
              <span>{ROTULO_TIPO_CALL[proxima.tipo]}</span>
              {proxima.liveCoachAtivo && (
                <span>
                  <Layers3 size={13} aria-hidden="true" /> Live Coach pronto
                </span>
              )}
            </div>
          </div>

          <div className={styles.proximaHorario}>
            <div className={styles.dataPrincipal}>
              <CalendarDays size={18} strokeWidth={1.7} aria-hidden="true" />
              <span>
                <small>{DATA_LONGA.format(new Date(proxima.agendadaPara))}</small>
                <strong>{HORA.format(new Date(proxima.agendadaPara))}</strong>
              </span>
            </div>
            <div className={styles.duracao}>
              <Clock3 size={15} strokeWidth={1.8} aria-hidden="true" />
              {proxima.duracaoMinutos} minutos
            </div>
            <AcoesSala codigo={proxima.codigoPublico} destaque />
          </div>
        </section>
      )}

      <section className={styles.automacao} aria-labelledby="fluxo-calls-titulo">
        <header>
          <p>Durante e depois da call</p>
          <h2 id="fluxo-calls-titulo">O que fica salvo</h2>
        </header>
        <ol className={styles.trilha}>
          <li>
            <span>
              <Radio size={17} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <strong>Call</strong>
              <small>Reunião feita pela plataforma</small>
            </div>
          </li>
          <li>
            <span>
              <FileAudio size={17} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <strong>Transcrição</strong>
              <small>Conversa registrada em texto</small>
            </div>
          </li>
          <li>
            <span>
              <Database size={17} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <strong>CRM</strong>
              <small>Resumo salvo na oportunidade</small>
            </div>
          </li>
          <li>
            <span>
              <BrainCircuit size={17} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <strong>Próxima ação</strong>
              <small>Compromisso e data registrados</small>
            </div>
          </li>
        </ol>
      </section>

      <div className={styles.operacao}>
        <section className={styles.agenda} aria-labelledby="agenda-titulo">
          <header className={styles.secaoTopo}>
            <div>
              <h2 id="agenda-titulo">{proxima || recemAgendada ? 'Depois desta' : 'Agenda'}</h2>
              <p>
                {proxima
                  ? seguintes.length > 0
                    ? `${seguintes.length} ${seguintes.length === 1 ? 'call na sequência' : 'calls na sequência'}.`
                    : 'Nenhuma outra call depois desta.'
                  : recemAgendada
                    ? 'Nenhuma outra call aguardando.'
                    : 'Suas próximas calls aparecerão aqui.'}
              </p>
            </div>
            <CalendarDays size={20} strokeWidth={1.7} aria-hidden="true" />
          </header>

          {!proxima && recemAgendada ? (
            <div className={styles.agendaLivre}>
              <span>
                <CalendarDays size={19} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <div>
                <strong>Não há outra call agendada</strong>
                <p>Ao terminar, registre a próxima ação combinada com o cliente.</p>
              </div>
            </div>
          ) : !proxima ? (
            <div className={styles.vazio}>
              <span className={styles.pulsoVazio} aria-hidden="true">
                <Radio size={22} strokeWidth={1.6} />
              </span>
              <div>
                <h3>Nenhuma call agendada</h3>
                <p>
                  Escolha uma oportunidade do CRM para criar a sala e manter a reunião ligada ao
                  histórico do cliente.
                </p>
              </div>
              {oportunidades.length === 0 ? (
                <Link href="/crm" className={styles.acaoVazio}>
                  Adicionar lead <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : (
                <FormularioAgendarCall
                  oportunidades={oportunidades}
                  calendar={calendar}
                  oportunidadeInicial={oportunidadeInicial}
                  tipoInicial={tipoInicial}
                />
              )}
            </div>
          ) : seguintes.length > 0 ? (
            <div className={styles.lista}>
              {seguintes.map((reuniao) => (
                <article className={styles.reuniao} key={reuniao.id}>
                  <div className={styles.dataBloco}>
                    <strong>{DATA.format(new Date(reuniao.agendadaPara)).replace('.', '')}</strong>
                    <span>{HORA.format(new Date(reuniao.agendadaPara))}</span>
                  </div>
                  <div className={styles.reuniaoConteudo}>
                    <div className={styles.reuniaoMeta}>
                      <span data-status={reuniao.status}>{ROTULO_STATUS_CALL[reuniao.status]}</span>
                      <span>{ROTULO_TIPO_CALL[reuniao.tipo]}</span>
                      {reuniao.liveCoachAtivo && (
                        <span className={styles.coachTag}>
                          <Layers3 size={12} aria-hidden="true" /> Live Coach
                        </span>
                      )}
                    </div>
                    <h3>{reuniao.titulo}</h3>
                    <p>
                      <ContactRound size={14} strokeWidth={1.8} aria-hidden="true" />
                      {reuniao.empresa}
                      {reuniao.contato ? ` · ${reuniao.contato}` : ''}
                    </p>
                    <small>
                      {DATA_LONGA.format(new Date(reuniao.agendadaPara))} · {reuniao.duracaoMinutos}{' '}
                      minutos
                    </small>
                  </div>
                  <AcoesSala codigo={reuniao.codigoPublico} />
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.agendaLivre}>
              <span>
                <CalendarDays size={19} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <div>
                <strong>Não há outra call depois desta</strong>
                <p>Registre a próxima ação antes de encerrar a reunião.</p>
              </div>
            </div>
          )}
        </section>

        <aside className={styles.liveCoach} aria-labelledby="live-coach-titulo">
          <div className={styles.coachCabecalho}>
            <span className={styles.coachSinal} aria-hidden="true">
              <AudioLines size={30} strokeWidth={1.6} />
            </span>
            <span>
              {comCoach} {comCoach === 1 ? 'sala preparada' : 'salas preparadas'}
            </span>
          </div>
          <p>{ativas.length ? 'Ajuda durante a call' : 'Como funciona'}</p>
          <h2 id="live-coach-titulo">Live Coach</h2>
          <p>
            {ativas.length
              ? 'As sugestões aparecem somente para você, durante a conversa.'
              : 'Ao abrir uma sala, o Live Coach usa a transcrição para sugerir perguntas.'}
          </p>
          <ul>
            <li>
              <strong>Escuta</strong>
              <span>Transcreve a conversa em tempo real.</span>
            </li>
            <li>
              <strong>Leitura</strong>
              <span>Identifica dores, impacto e objeções.</span>
            </li>
            <li>
              <strong>Sugestão</strong>
              <span>Recomenda a próxima pergunta.</span>
            </li>
          </ul>
          <span className={styles.estadoCoach}>
            {ativas.length
              ? 'Operacional · privado para o anfitrião'
              : 'Exemplo · nada está sendo analisado agora'}
          </span>
        </aside>
      </div>

      {historico.length > 0 && (
        <section className={styles.historico} aria-labelledby="historico-titulo">
          <header className={styles.secaoTopo}>
            <div>
              <h2 id="historico-titulo">Histórico</h2>
              <p>Calls encerradas, processadas ou canceladas.</p>
            </div>
          </header>
          <div className={styles.historicoLista}>
            {historico.map((reuniao) => (
              <article key={reuniao.id}>
                <span>{ROTULO_STATUS_CALL[reuniao.status]}</span>
                <Link href={`/calls/${reuniao.id}`} className={styles.historicoLink}>
                  <div>
                    <strong>{reuniao.titulo}</strong>
                    <small>
                      {reuniao.empresa} · {DATA_LONGA.format(new Date(reuniao.agendadaPara))}
                    </small>
                  </div>
                  <span>
                    Abrir pós-call <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
