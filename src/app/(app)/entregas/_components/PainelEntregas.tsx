import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FolderKanban,
  MessageSquareMore,
  ShieldCheck,
} from 'lucide-react';
import type { ResumoProjetoExecucao } from '@/lib/projetos-execucao/queries';
import {
  classificarPrioridadeEntrega,
  ordenarEntregasPorPrioridade,
  type PrioridadeEntrega,
} from '@/lib/projetos-execucao/prioridade';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';
import styles from './PainelEntregas.module.css';

function formatarPrazo(valor: string | null): string {
  if (!valor) return 'Prazo a definir';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  })
    .format(new Date(valor))
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
          </span>
          <span className={styles.sinal} data-grupo={prioridade.grupo}>
            <IconePrioridade prioridade={prioridade} />
            {prioridade.rotulo}
          </span>
        </header>

        <div className={styles.identidade}>
          <p>{projeto.empresa}</p>
          <h2>{projeto.titulo}</h2>
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
            <span className={styles.abrirEntrega}>
              {destaque ? 'Abrir próxima tarefa' : 'Abrir entrega'}
              <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" />
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

        <span className={styles.linhaAbrir}>
          Abrir
          <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" />
        </span>
      </Link>
    </article>
  );
}

function EstadoVazio() {
  return (
    <section className={styles.vazio} aria-labelledby="entregas-vazias-titulo">
      <span className={styles.vazioIcone} aria-hidden="true">
        <ClipboardCheck size={24} strokeWidth={1.6} />
      </span>
      <div>
        <p className={styles.eyebrow}>Nenhuma entrega aberta</p>
        <h2 id="entregas-vazias-titulo">A próxima começa quando uma proposta for aceita.</h2>
        <p>
          O cliente, o escopo vendido e o passo a passo aparecem aqui automaticamente. A execução
          continua sendo feita por você.
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
  const concluidos = projetos.filter((projeto) => projeto.status === 'concluido');
  const prioridades = new Map(
    ativos.map((projeto) => [projeto.id, classificarPrioridadeEntrega(projeto, agora)]),
  );
  const precisamAcao = ativos.filter(
    (projeto) => prioridades.get(projeto.id)?.grupo === 'acao',
  ).length;
  const aguardandoCliente = ativos.filter(
    (projeto) => prioridades.get(projeto.id)?.grupo === 'cliente',
  ).length;
  const noRitmo = ativos.filter((projeto) => prioridades.get(projeto.id)?.grupo === 'ritmo').length;
  const principal = ativos[0] ?? null;
  const prioridadePrincipal = principal ? prioridades.get(principal.id) : null;
  const demaisAtivos = ativos.slice(1);

  return (
    <div className={styles.pagina}>
      <header className={styles.hero}>
        <div className={styles.heroTexto}>
          <p className={styles.eyebrow}>Projetos em execução</p>
          <h1>Entregas dos clientes</h1>
          <p>
            Comece pelo que exige ação, acompanhe as validações e mantenha cada cliente dentro do
            prazo combinado.
          </p>
        </div>
        <dl className={styles.resumo} aria-label="Resumo das entregas">
          <div>
            <dt>Pedem ação</dt>
            <dd>{precisamAcao}</dd>
          </div>
          <div>
            <dt>Com o cliente</dt>
            <dd>{aguardandoCliente}</dd>
          </div>
          <div>
            <dt>No ritmo</dt>
            <dd>{noRitmo}</dd>
          </div>
          <div>
            <dt>Entregues</dt>
            <dd>{concluidos.length}</dd>
          </div>
        </dl>
      </header>

      {principal ? (
        <section className={styles.emAndamento} aria-labelledby="titulo-em-andamento">
          <header className={styles.cabecalhoSecao}>
            <div>
              <p className={styles.eyebrow}>Prioridade agora</p>
              <h2 id="titulo-em-andamento">Comece por {principal.empresa}.</h2>
            </div>
            <p>
              {prioridadePrincipal?.rotulo}. {prioridadePrincipal?.detalhe}.
            </p>
          </header>

          {prioridadePrincipal && (
            <CartaoEntrega projeto={principal} prioridade={prioridadePrincipal} destaque />
          )}

          {demaisAtivos.length > 0 && (
            <div className={styles.demais}>
              <header>
                <div>
                  <h2>Fila de trabalho</h2>
                  <p>Ordenada pelo que exige atenção primeiro.</p>
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
      ) : (
        <EstadoVazio />
      )}

      {concluidos.length > 0 && (
        <section className={styles.concluidas} aria-labelledby="titulo-concluidas">
          <header className={styles.cabecalhoSecao}>
            <div>
              <p className={styles.eyebrow}>Histórico</p>
              <h2 id="titulo-concluidas">Entregas concluídas</h2>
            </div>
            <p>Consulte evidências, arquivos e aceite final quando precisar.</p>
          </header>

          <ol className={styles.listaConcluidas}>
            {concluidos.map((projeto) => (
              <li key={projeto.id}>
                <Link href={`/entregas/${projeto.id}`}>
                  <span className={styles.checkConcluido} aria-hidden="true">
                    <Check size={15} strokeWidth={1.8} />
                  </span>
                  <span>
                    <small>{projeto.empresa}</small>
                    <strong>{projeto.titulo}</strong>
                  </span>
                  <span className={styles.dataConcluida}>
                    Atualizada {formatarPrazo(projeto.atualizadoEm)}
                  </span>
                  <ArrowRight size={16} strokeWidth={1.7} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
