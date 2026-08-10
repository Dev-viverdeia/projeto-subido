import Link from 'next/link';
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  Clock3,
  ContactRound,
  Database,
  FileAudio,
  Radio,
  Layers3,
} from 'lucide-react';
import { ROTULO_STATUS_CALL, ROTULO_TIPO_CALL, callPodeAbrir } from '@/lib/calls/tipos';
import type { ReuniaoCall } from '@/lib/calls/queries';
import type { OportunidadeSeletor } from '@/lib/crm/queries';
import { AcoesSala } from './AcoesSala';
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
  agendada = false,
  modalInicial = false,
  oportunidadeInicial,
}: {
  reunioes: ReuniaoCall[];
  oportunidades: OportunidadeSeletor[];
  agendada?: boolean;
  modalInicial?: boolean;
  oportunidadeInicial?: string;
}) {
  const ativas = reunioes.filter((item) => callPodeAbrir(item.status));
  const historico = reunioes
    .filter((item) => !callPodeAbrir(item.status))
    .sort((a, b) => b.agendadaPara.localeCompare(a.agendadaPara));
  const comCoach = ativas.filter((item) => item.liveCoachAtivo).length;
  const proxima = ativas[0];
  const seguintes = ativas.slice(1);

  return (
    <div className={styles.pagina}>
      <header className={styles.topo}>
        <div className={styles.introducao}>
          <p className={styles.sobretitulo}>Central de conversas</p>
          <h1>Calls</h1>
          <p>Cada reunião vira contexto no CRM, direção para a venda e memória para a entrega.</p>
        </div>
        <FormularioAgendarCall
          oportunidades={oportunidades}
          abertoInicial={modalInicial}
          oportunidadeInicial={oportunidadeInicial}
        />
      </header>

      {agendada && (
        <div className={styles.confirmacao} role="status">
          <Layers3 size={17} strokeWidth={1.8} aria-hidden="true" />
          Call criada. O link já está disponível e o CRM recebeu o primeiro fato.
        </div>
      )}

      {proxima && (
        <section className={styles.proximaCall} data-on-dark aria-labelledby="proxima-call-titulo">
          <div className={styles.proximaContexto}>
            <div className={styles.proximaLinha}>
              <p>Sua próxima call</p>
              <span data-status={proxima.status}>
                <i /> {ROTULO_STATUS_CALL[proxima.status]}
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
          <p>Enquanto você conversa</p>
          <h2 id="fluxo-calls-titulo">O sistema trabalha junto</h2>
        </header>
        <ol className={styles.trilha}>
          <li>
            <span>
              <Radio size={17} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <strong>Call</strong>
              <small>Conversa no mesmo ambiente</small>
            </div>
          </li>
          <li>
            <span>
              <FileAudio size={17} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <strong>Transcrição</strong>
              <small>Falas e decisões preservadas</small>
            </div>
          </li>
          <li>
            <span>
              <Database size={17} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <strong>CRM</strong>
              <small>Fatos entram na oportunidade</small>
            </div>
          </li>
          <li>
            <span>
              <BrainCircuit size={17} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <strong>Próximo passo</strong>
              <small>A ação nasce com contexto</small>
            </div>
          </li>
        </ol>
      </section>

      <div className={styles.operacao}>
        <section className={styles.agenda} aria-labelledby="agenda-titulo">
          <header className={styles.secaoTopo}>
            <div>
              <h2 id="agenda-titulo">{proxima ? 'Depois desta' : 'Agenda'}</h2>
              <p>
                {proxima
                  ? `${seguintes.length} ${seguintes.length === 1 ? 'call na sequência' : 'calls na sequência'}.`
                  : 'As próximas salas ligadas ao seu pipeline.'}
              </p>
            </div>
            <CalendarDays size={20} strokeWidth={1.7} aria-hidden="true" />
          </header>

          {!proxima ? (
            <div className={styles.vazio}>
              <span className={styles.pulsoVazio} aria-hidden="true">
                <Radio size={22} strokeWidth={1.6} />
              </span>
              <div>
                <h3>Nenhuma call agendada</h3>
                <p>
                  Escolha uma oportunidade do CRM para criar a primeira sala e começar a registrar a
                  jornada real do cliente.
                </p>
              </div>
              {oportunidades.length === 0 ? (
                <Link href="/crm" className={styles.acaoVazio}>
                  Adicionar lead <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : (
                <FormularioAgendarCall
                  oportunidades={oportunidades}
                  oportunidadeInicial={oportunidadeInicial}
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
                <strong>Agenda livre depois desta call</strong>
                <p>Use o espaço para registrar o próximo passo antes de abrir outra conversa.</p>
              </div>
            </div>
          )}
        </section>

        <aside className={styles.liveCoach} aria-labelledby="live-coach-titulo">
          <div className={styles.coachCabecalho}>
            <span className={styles.coachSinal} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>
              {comCoach} {comCoach === 1 ? 'sala preparada' : 'salas preparadas'}
            </span>
          </div>
          <p>{ativas.length ? 'Copiloto privado' : 'Prévia guiada'}</p>
          <h2 id="live-coach-titulo">Live Coach</h2>
          <p>
            {ativas.length
              ? 'Uma recomendação por vez, no momento em que ela pode mudar a conversa.'
              : 'Ao abrir sua primeira sala, as sugestões passam a usar o contexto real da reunião.'}
          </p>
          <ul>
            <li>
              <strong>Escuta</strong>
              <span>Transcreve sem tirar você da call.</span>
            </li>
            <li>
              <strong>Leitura</strong>
              <span>Identifica dor, impacto e objeção.</span>
            </li>
            <li>
              <strong>Direção</strong>
              <span>Sugere a melhor próxima pergunta.</span>
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
