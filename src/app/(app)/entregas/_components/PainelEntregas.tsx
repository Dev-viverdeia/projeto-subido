import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FolderKanban,
  MessageSquareMore,
  Repeat2,
  ShieldCheck,
} from 'lucide-react';
import type { ResumoProjetoExecucao } from '@/lib/projetos-execucao/queries';
import {
  classificarPrioridadeEntrega,
  ordenarEntregasPorPrioridade,
  type PrioridadeEntrega,
} from '@/lib/projetos-execucao/prioridade';
import { classificarRevisaoEvolucao } from '@/lib/projetos-execucao/radar-evolucao';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';
import { estaEmAcompanhamento } from '@/lib/projetos-execucao/gestao';
import { CabecalhoOperacional } from '../../_components/CabecalhoOperacional';
import styles from './PainelEntregas.module.css';
import { RadarPosEntrega } from './RadarPosEntrega';

function formatarPrazo(valor: string | null): string {
  if (!valor) return 'Prazo a definir';

  const data = /^\d{4}-\d{2}-\d{2}$/.test(valor)
    ? new Date(`${valor}T12:00:00-03:00`)
    : new Date(valor);

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  })
    .format(data)
    .replace('.', '');
}

function progresso(projeto: ResumoProjetoExecucao): number {
  return projeto.total ? Math.round((projeto.feitas / projeto.total) * 100) : 0;
}

function IconePrioridade({ prioridade }: { prioridade: PrioridadeEntrega }) {
  if (prioridade.grupo === 'acao') return <CircleAlert size={16} strokeWidth={1.7} />;
  if (prioridade.grupo === 'cliente') return <MessageSquareMore size={16} strokeWidth={1.7} />;
  return <ShieldCheck size={16} strokeWidth={1.7} />;
}

function CartaoEntrega({
  projeto,
  prioridade,
  destaque = false,
}: {
  projeto: ResumoProjetoExecucao;
  prioridade: PrioridadeEntrega;
  destaque?: boolean;
}) {
  const percentual = progresso(projeto);
  const prazoOperacional = projeto.proximaAcaoPrazoEm ?? projeto.prazoEm;

  return (
    <article
      className={styles.cartao}
      data-destaque={destaque || undefined}
      data-prioridade={prioridade.grupo}
    >
      <Link href={`/entregas/${projeto.id}`} aria-label={`Abrir entrega de ${projeto.empresa}`}>
        <header className={styles.cartaoTopo}>
          <span className={styles.iconeEntrega} aria-hidden="true">
            <FolderKanban size={18} strokeWidth={1.7} />
          </span>
          <span className={styles.estado} data-status={projeto.status}>
            {ROTULO_STATUS_PROJETO[projeto.status]}
            {projeto.tipoServico === 'recorrente' ? ' · Recorrente' : ''}
          </span>
          <span className={styles.sinal} data-grupo={prioridade.grupo}>
            <IconePrioridade prioridade={prioridade} />
            {prioridade.rotulo}
          </span>
        </header>

        <div className={styles.identidade}>
          <p>{projeto.empresa}</p>
          <h3>{projeto.titulo}</h3>
          <span className={styles.abrirEntrega}>
            {destaque ? 'Continuar entrega' : 'Abrir entrega'}
            <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" />
          </span>
        </div>

        <div className={styles.proximaAcao}>
          <Clock3 size={16} strokeWidth={1.7} aria-hidden="true" />
          <div>
            <span>{destaque ? 'Comece por aqui' : 'Próxima ação'}</span>
            <strong>{projeto.proximaTarefa ?? 'Formalize a entrega final com o cliente'}</strong>
            <small>{prioridade.detalhe}</small>
          </div>
        </div>

        <footer className={styles.cartaoRodape}>
          <div className={styles.medida} aria-label={`${percentual}% da entrega concluída`}>
            <div aria-hidden="true">
              <span style={{ transform: `scaleX(${percentual / 100})` }} />
            </div>
            <strong>{percentual}%</strong>
          </div>
          <div className={styles.cartaoMeta}>
            <span className={styles.prazo}>
              <CalendarDays size={14} strokeWidth={1.7} aria-hidden="true" />
              {projeto.proximaAcaoPrazoEm ? 'Próxima ação' : 'Entrega'} ·{' '}
              {formatarPrazo(prazoOperacional)}
            </span>
          </div>
        </footer>
      </Link>
    </article>
  );
}

function LinhaEntrega({
  projeto,
  prioridade,
  posicao,
}: {
  projeto: ResumoProjetoExecucao;
  prioridade: PrioridadeEntrega;
  posicao: number;
}) {
  const percentual = progresso(projeto);
  const prazoOperacional = projeto.proximaAcaoPrazoEm ?? projeto.prazoEm;

  return (
    <article className={styles.linhaEntrega} data-prioridade={prioridade.grupo}>
      <Link href={`/entregas/${projeto.id}`} aria-label={`Abrir entrega de ${projeto.empresa}`}>
        <span className={styles.posicao} aria-hidden="true">
          {String(posicao).padStart(2, '0')}
        </span>

        <div className={styles.linhaIdentidade}>
          <small>{projeto.empresa}</small>
          <strong>{projeto.titulo}</strong>
          <span className={styles.sinal} data-grupo={prioridade.grupo}>
            <IconePrioridade prioridade={prioridade} />
            {prioridade.rotulo}
          </span>
        </div>

        <div className={styles.linhaAcao}>
          <span>Próxima ação</span>
          <strong>{projeto.proximaTarefa ?? 'Formalizar a entrega final com o cliente'}</strong>
          <small>{prioridade.detalhe}</small>
        </div>

        <div className={styles.linhaPrazo}>
          <CalendarDays size={15} strokeWidth={1.7} aria-hidden="true" />
          <span>{projeto.proximaAcaoPrazoEm ? 'Próxima ação' : 'Entrega'}</span>
          <strong>{formatarPrazo(prazoOperacional)}</strong>
        </div>

        <div className={styles.linhaProgresso} aria-label={`${percentual}% da entrega concluída`}>
          <strong>{percentual}%</strong>
          <div aria-hidden="true">
            <span style={{ transform: `scaleX(${percentual / 100})` }} />
          </div>
        </div>

        <span className={styles.linhaAbrir} aria-hidden="true">
          <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" />
        </span>
      </Link>
    </article>
  );
}

function EstadoVazio({ temPosEntrega }: { temPosEntrega: boolean }) {
  return (
    <section className={styles.vazio} aria-labelledby="entregas-vazias-titulo">
      <span className={styles.vazioIcone} aria-hidden="true">
        <ClipboardCheck size={24} strokeWidth={1.6} />
      </span>
      <div>
        <p className={styles.eyebrow}>
          {temPosEntrega ? 'Execução em dia' : 'Nenhuma entrega aberta'}
        </p>
        <h2 id="entregas-vazias-titulo">
          {temPosEntrega
            ? 'Nenhum projeto está em execução agora.'
            : 'A próxima começa quando uma proposta for aceita.'}
        </h2>
        <p>
          {temPosEntrega
            ? 'Use as revisões acima para acompanhar o resultado dos clientes já atendidos.'
            : 'O cliente, o escopo vendido e o passo a passo aparecem aqui automaticamente. A execução continua sendo feita por você.'}
        </p>
      </div>
      <Link href="/propostas" className={styles.acaoSecundaria}>
        Ver propostas <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}

export function PainelEntregas({
  projetos,
  agora = new Date(),
}: {
  projetos: ResumoProjetoExecucao[];
  agora?: Date;
}) {
  const ativos = ordenarEntregasPorPrioridade(
    projetos.filter((projeto) => projeto.status !== 'concluido'),
    agora,
  );
  const recorrentes = projetos.filter(estaEmAcompanhamento).sort((a, b) => {
    if (!a.proximaAcaoPrazoEm) return b.proximaAcaoPrazoEm ? -1 : 0;
    if (!b.proximaAcaoPrazoEm) return 1;
    return a.proximaAcaoPrazoEm.localeCompare(b.proximaAcaoPrazoEm);
  });
  const concluidos = projetos.filter(
    (projeto) => projeto.status === 'concluido' && !estaEmAcompanhamento(projeto),
  );
  const prioridades = new Map(
    ativos.map((projeto) => [projeto.id, classificarPrioridadeEntrega(projeto, agora)]),
  );
  const precisamAcao = ativos.filter(
    (projeto) => prioridades.get(projeto.id)?.grupo === 'acao',
  ).length;
  const principal = ativos[0] ?? null;
  const prioridadePrincipal = principal ? prioridades.get(principal.id) : null;
  const demaisAtivos = ativos.slice(1);

  return (
    <div className={styles.pagina}>
      <CabecalhoOperacional
        titulo="Entregas"
        resumo={
          <dl className={styles.resumo} aria-label="Resumo das entregas">
            <div>
              <dt>Em execução</dt>
              <dd>{ativos.length}</dd>
            </div>
            <div>
              <dt>Recorrentes</dt>
              <dd>{recorrentes.length}</dd>
            </div>
            <div>
              <dt>Concluídas</dt>
              <dd>{concluidos.length}</dd>
            </div>
          </dl>
        }
      />

      {principal ? (
        <section className={styles.emAndamento} aria-labelledby="titulo-em-andamento">
          <header className={styles.cabecalhoSecao}>
            <div>
              <h2 id="titulo-em-andamento">Para fazer agora</h2>
            </div>
            {precisamAcao > 0 && <p>{precisamAcao} com pendências</p>}
          </header>

          {prioridadePrincipal && (
            <CartaoEntrega projeto={principal} prioridade={prioridadePrincipal} destaque />
          )}

          {demaisAtivos.length > 0 && (
            <div className={styles.demais}>
              <header>
                <div>
                  <h2>Fila de trabalho</h2>
                </div>
                <span>{demaisAtivos.length} na fila</span>
              </header>
              <ol className={styles.fila}>
                {demaisAtivos.map((projeto, indice) => (
                  <li key={projeto.id}>
                    <LinhaEntrega
                      projeto={projeto}
                      prioridade={
                        prioridades.get(projeto.id) ?? classificarPrioridadeEntrega(projeto, agora)
                      }
                      posicao={indice + 2}
                    />
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      ) : recorrentes.length === 0 ? (
        <EstadoVazio temPosEntrega={concluidos.some((projeto) => projeto.evolucao)} />
      ) : null}

      {recorrentes.length > 0 && (
        <section className={styles.recorrentes} aria-labelledby="titulo-recorrentes">
          <header className={styles.cabecalhoRecorrentes}>
            <div>
              <h2 id="titulo-recorrentes">Em acompanhamento</h2>
              <p>Projetos entregues que continuam com você.</p>
            </div>
            <Repeat2 size={23} aria-hidden="true" />
          </header>
          <ul className={styles.listaRecorrentes}>
            {recorrentes.map((projeto) => (
              <li key={projeto.id}>
                <Link href={`/entregas/${projeto.id}`} aria-label={`Acompanhar ${projeto.empresa}`}>
                  <div className={styles.clienteRecorrente}>
                    <span>{projeto.empresa}</span>
                    <strong>{projeto.titulo}</strong>
                  </div>
                  <div className={styles.acaoRecorrente}>
                    <span>Próxima ação</span>
                    <strong>{projeto.proximaTarefa ?? 'Agende o próximo cuidado'}</strong>
                    {projeto.proximaAcaoPrazoEm && (
                      <time dateTime={projeto.proximaAcaoPrazoEm}>
                        {formatarPrazo(projeto.proximaAcaoPrazoEm)}
                      </time>
                    )}
                  </div>
                  <span className={styles.abrirRecorrente}>
                    Acompanhar <ArrowUpRight size={17} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RadarPosEntrega projetos={concluidos} agora={agora} />

      {concluidos.length > 0 && (
        <details className={styles.concluidas}>
          <summary className={styles.cabecalhoSecao}>
            <div>
              <h2 id="titulo-concluidas">Entregas concluídas</h2>
            </div>
            <span className={styles.resumoConcluidas}>
              <span>{concluidos.length}</span>
              <ChevronDown size={17} aria-hidden="true" />
            </span>
          </summary>

          <ol className={styles.listaConcluidas}>
            {concluidos.map((projeto) => {
              const sinal = projeto.evolucao
                ? classificarRevisaoEvolucao(projeto.evolucao, agora)
                : null;
              return (
                <li key={projeto.id}>
                  <Link href={`/entregas/${projeto.id}`}>
                    <span className={styles.checkConcluido} aria-hidden="true">
                      <Check size={15} strokeWidth={1.8} />
                    </span>
                    <span>
                      <small>{projeto.empresa}</small>
                      <strong>{projeto.titulo}</strong>
                    </span>
                    <span className={styles.dataConcluida} data-status={sinal?.status ?? undefined}>
                      {sinal
                        ? sinal.status === 'registrada'
                          ? sinal.rotulo
                          : `${sinal.rotulo} · ${formatarPrazo(projeto.evolucao!.revisaoEm)}`
                        : `Atualizada ${formatarPrazo(projeto.atualizadoEm)}`}
                    </span>
                    <ArrowRight size={16} strokeWidth={1.7} aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </details>
      )}
    </div>
  );
}
