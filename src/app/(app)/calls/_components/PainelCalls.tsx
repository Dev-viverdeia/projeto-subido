import Link from 'next/link';
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  ContactRound,
  Database,
  FileAudio,
  Radio,
  Sparkles,
} from 'lucide-react';
import { ROTULO_STATUS_CALL, ROTULO_TIPO_CALL, callPodeAbrir } from '@/lib/calls/tipos';
import type { ReuniaoCall } from '@/lib/calls/queries';
import type { OportunidadeCrm } from '@/lib/crm/queries';
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
}: {
  reunioes: ReuniaoCall[];
  oportunidades: OportunidadeCrm[];
  agendada?: boolean;
  modalInicial?: boolean;
}) {
  const ativas = reunioes.filter((item) => callPodeAbrir(item.status));
  const historico = reunioes
    .filter((item) => !callPodeAbrir(item.status))
    .sort((a, b) => b.agendadaPara.localeCompare(a.agendadaPara));
  const comCoach = ativas.filter((item) => item.liveCoachAtivo).length;

  return (
    <div className={styles.pagina}>
      <header className={styles.topo}>
        <div className={styles.introducao}>
          <p className={styles.sobretitulo}>Conversas que viram contexto</p>
          <h1>Calls que alimentam o trabalho</h1>
          <p>
            Agende, conduza e transforme cada conversa em memória útil para o CRM, a venda e a
            entrega do projeto.
          </p>
        </div>
        <FormularioAgendarCall oportunidades={oportunidades} abertoInicial={modalInicial} />
      </header>

      {agendada && (
        <div className={styles.confirmacao} role="status">
          <Sparkles size={17} strokeWidth={1.8} aria-hidden="true" />
          Call criada. O link já está disponível e o CRM recebeu o primeiro fato.
        </div>
      )}

      <section className={styles.fluxo} aria-labelledby="fluxo-calls-titulo">
        <div className={styles.fluxoCabecalho}>
          <div>
            <p>Uma única conversa</p>
            <h2 id="fluxo-calls-titulo">Quatro camadas de inteligência</h2>
          </div>
          <span>
            {ativas.length} agendadas · {comCoach} com Live Coach
          </span>
        </div>
        <ol className={styles.trilha}>
          <li>
            <span className={styles.noAtivo}>
              <Radio size={18} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <strong>Call</strong>
              <small>Áudio e vídeo no mesmo ambiente</small>
            </div>
          </li>
          <li>
            <span>
              <FileAudio size={18} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <strong>Transcrição</strong>
              <small>Falas, decisões e contexto preservados</small>
            </div>
          </li>
          <li>
            <span>
              <Database size={18} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <strong>CRM factual</strong>
              <small>Dores e próximos passos na oportunidade</small>
            </div>
          </li>
          <li>
            <span>
              <BrainCircuit size={18} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <strong>Próxima ação</strong>
              <small>Sobral AI, proposta e entrega com memória</small>
            </div>
          </li>
        </ol>
      </section>

      <div className={styles.operacao}>
        <section className={styles.agenda} aria-labelledby="agenda-titulo">
          <header className={styles.secaoTopo}>
            <div>
              <h2 id="agenda-titulo">Agenda</h2>
              <p>As próximas salas ligadas ao seu pipeline.</p>
            </div>
            <CalendarDays size={20} strokeWidth={1.7} aria-hidden="true" />
          </header>

          {ativas.length === 0 ? (
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
                <FormularioAgendarCall oportunidades={oportunidades} />
              )}
            </div>
          ) : (
            <div className={styles.lista}>
              {ativas.map((reuniao) => (
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
                          <Sparkles size={12} aria-hidden="true" /> Live Coach
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
          )}
        </section>

        <aside className={styles.liveCoach} aria-labelledby="live-coach-titulo">
          <div className={styles.coachSinal} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <p>Durante a call</p>
          <h2 id="live-coach-titulo">Live Coach</h2>
          <p>
            A conversa é transcrita enquanto acontece. O agente identifica sinais e recomenda a
            melhor próxima pergunta sem tirar você da reunião.
          </p>
          <ul>
            <li>Investigar uma dor ainda superficial</li>
            <li>Confirmar impacto antes de apresentar solução</li>
            <li>Tratar objeção com contexto da própria conversa</li>
          </ul>
          <span className={styles.estadoCoach}>Operacional · privado para o anfitrião</span>
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
                <div>
                  <strong>{reuniao.titulo}</strong>
                  <small>
                    {reuniao.empresa} · {DATA_LONGA.format(new Date(reuniao.agendadaPara))}
                  </small>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
