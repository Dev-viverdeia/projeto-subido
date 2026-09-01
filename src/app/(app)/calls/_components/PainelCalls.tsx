import Link from 'next/link';
import {
  AudioLines,
  ArrowRight,
  CalendarDays,
  Clock3,
  ContactRound,
  Radio,
  Layers3,
} from 'lucide-react';
import {
  ROTULO_STATUS_CALL,
  ROTULO_TIPO_CALL,
  callPassouDaJanela,
  callPodeAbrir,
} from '@/lib/calls/tipos';
import type { TipoCall } from '@/lib/calls/tipos';
import type { ReuniaoCall } from '@/lib/calls/queries';
import type { OportunidadeSeletor } from '@/lib/crm/queries';
import type { EstadoGoogleCalendar } from '@/lib/google-calendar/queries';
import { RetornoOperacao } from '../../_components/RetornoOperacao';
import { AcoesSala } from './AcoesSala';
import { CabecalhoReunioes } from './CabecalhoReunioes';
import { CallRecemAgendada } from './CallRecemAgendada';
import { FormularioAgendarCall } from './FormularioAgendarCall';
import { PendenciasReunioes } from './PendenciasReunioes';
import { RetornosReunioes } from './RetornosReunioes';
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
  comercialLiberado = true,
  calendar,
  agendadaId,
  modalInicial = false,
  oportunidadeInicial,
  tipoInicial,
  calendarResultado,
  pendenciaResultado,
  agora = new Date(),
}: {
  reunioes: ReuniaoCall[];
  oportunidades: OportunidadeSeletor[];
  comercialLiberado?: boolean;
  calendar: EstadoGoogleCalendar;
  agendadaId?: string;
  modalInicial?: boolean;
  oportunidadeInicial?: string;
  tipoInicial?: TipoCall;
  calendarResultado?: 'sincronizado' | 'falhou';
  pendenciaResultado?: 'reagendar' | 'cancelada' | 'erro';
  agora?: Date;
}) {
  const pendentes = reunioes
    .filter((item) => callPassouDaJanela(item, agora))
    .sort((a, b) => b.agendadaPara.localeCompare(a.agendadaPara));
  const ativas = reunioes.filter(
    (item) => callPodeAbrir(item.status) && !callPassouDaJanela(item, agora),
  );
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
      <CabecalhoReunioes comercialLiberado={comercialLiberado}>
        <FormularioAgendarCall
          oportunidades={oportunidades}
          comercialLiberado={comercialLiberado}
          calendar={calendar}
          abertoInicial={modalInicial}
          oportunidadeInicial={oportunidadeInicial}
          tipoInicial={tipoInicial}
        />
      </CabecalhoReunioes>

      <RetornosReunioes
        calendarResultado={calendarResultado}
        pendenciaResultado={pendenciaResultado}
      />

      {recemAgendada ? (
        <CallRecemAgendada
          reuniao={recemAgendada}
          calendar={calendar}
          comercialLiberado={comercialLiberado}
        />
      ) : agendadaId ? (
        <RetornoOperacao
          tom="sucesso"
          titulo="Reunião criada"
          descricao="Atualize a página para abrir a sala preparada."
        />
      ) : null}

      {proxima && (
        <section className={styles.proximaCall} data-on-dark aria-labelledby="proxima-call-titulo">
          <div className={styles.proximaContexto}>
            <div className={styles.proximaLinha}>
              <p>Sua próxima reunião</p>
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
            <AcoesSala id={proxima.id} codigo={proxima.codigoPublico} destaque />
          </div>
        </section>
      )}

      <PendenciasReunioes reunioes={pendentes} />

      <div className={styles.operacao}>
        <section className={styles.agenda} aria-labelledby="agenda-titulo">
          <header className={styles.secaoTopo}>
            <div>
              <h2 id="agenda-titulo">{proxima || recemAgendada ? 'Depois desta' : 'Agenda'}</h2>
              <p>
                {proxima
                  ? seguintes.length > 0
                    ? `${seguintes.length} ${seguintes.length === 1 ? 'reunião na sequência' : 'reuniões na sequência'}.`
                    : 'Nenhuma outra reunião depois desta.'
                  : recemAgendada
                    ? 'Nenhuma outra reunião aguardando.'
                    : 'Suas próximas reuniões aparecerão aqui.'}
              </p>
            </div>
            <div className={styles.resumoAgenda} aria-label="Resumo das reuniões">
              <span>{ativasNaAgenda.length} próximas</span>
              <span>{historico.length} no histórico</span>
            </div>
          </header>

          {!proxima && recemAgendada ? (
            <div className={styles.agendaLivre}>
              <span>
                <CalendarDays size={19} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <div>
                <strong>Não há outra reunião agendada</strong>
                <p>Ao terminar, registre a próxima ação combinada com o cliente.</p>
              </div>
            </div>
          ) : !proxima ? (
            <div className={styles.vazio}>
              <span className={styles.pulsoVazio} aria-hidden="true">
                <Radio size={22} strokeWidth={1.6} />
              </span>
              <div>
                <h3>Nenhuma reunião agendada</h3>
                <p>
                  {comercialLiberado
                    ? 'Escolha um cliente em Vendas para criar a sala e guardar a conversa na ficha.'
                    : 'Informe quem será convidado. A plataforma organiza o histórico automaticamente.'}
                </p>
              </div>
              {comercialLiberado && oportunidades.length === 0 ? (
                <Link href="/vendas" className={styles.acaoVazio}>
                  Adicionar cliente <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : (
                <FormularioAgendarCall
                  oportunidades={oportunidades}
                  comercialLiberado={comercialLiberado}
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
                  <AcoesSala id={reuniao.id} codigo={reuniao.codigoPublico} />
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.agendaLivre}>
              <span>
                <CalendarDays size={19} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <div>
                <strong>Não há outra reunião depois desta</strong>
                <p>Registre a próxima ação antes de encerrar a reunião.</p>
              </div>
            </div>
          )}
        </section>

        <aside className={styles.apoioCall} aria-label="Recursos da sala">
          <span className={styles.apoioIcone} aria-hidden="true">
            <AudioLines size={20} strokeWidth={1.7} />
          </span>
          <div>
            <strong>Live Coach</strong>
            <span>
              {comCoach > 0
                ? `${comCoach} ${comCoach === 1 ? 'reunião preparada' : 'reuniões preparadas'}`
                : 'Disponível ao abrir a sala'}
            </span>
          </div>
          <p>Transcrição, resumo e próxima ação são salvos na ficha do cliente.</p>
        </aside>
      </div>

      {historico.length > 0 && (
        <section className={styles.historico} aria-labelledby="historico-titulo">
          <header className={styles.secaoTopo}>
            <div>
              <h2 id="historico-titulo">Histórico</h2>
              <p>Reuniões encerradas, processadas ou canceladas.</p>
            </div>
          </header>
          <div className={styles.historicoLista}>
            {historico.map((reuniao) => (
              <article key={reuniao.id}>
                <span>{ROTULO_STATUS_CALL[reuniao.status]}</span>
                <Link href={`/reunioes/${reuniao.id}`} className={styles.historicoLink}>
                  <div>
                    <strong>{reuniao.titulo}</strong>
                    <small>
                      {reuniao.empresa} · {DATA_LONGA.format(new Date(reuniao.agendadaPara))}
                    </small>
                  </div>
                  <span>
                    Abrir resumo <ArrowRight size={14} aria-hidden="true" />
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
