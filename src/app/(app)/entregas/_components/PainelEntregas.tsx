import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleDot,
  ClipboardCheck,
  FolderKanban,
} from 'lucide-react';
import type { ResumoProjetoExecucao } from '@/lib/projetos-execucao/queries';
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

function CartaoEntrega({
  projeto,
  destaque = false,
}: {
  projeto: ResumoProjetoExecucao;
  destaque?: boolean;
}) {
  const percentual = progresso(projeto);

  return (
    <article className={styles.cartao} data-destaque={destaque || undefined}>
      <Link href={`/entregas/${projeto.id}`} aria-label={`Abrir entrega de ${projeto.empresa}`}>
        <header className={styles.cartaoTopo}>
          <span className={styles.iconeEntrega} aria-hidden="true">
            <FolderKanban size={18} strokeWidth={1.7} />
          </span>
          <span className={styles.estado} data-status={projeto.status}>
            {ROTULO_STATUS_PROJETO[projeto.status]}
          </span>
          <ArrowUpRight size={17} strokeWidth={1.7} aria-hidden="true" />
        </header>

        <div className={styles.identidade}>
          <p>{projeto.empresa}</p>
          <h2>{projeto.titulo}</h2>
        </div>

        <div className={styles.proximaAcao}>
          <CircleDot size={16} strokeWidth={1.7} aria-hidden="true" />
          <div>
            <span>Faça agora</span>
            <strong>{projeto.proximaTarefa ?? 'Formalize a entrega final com o cliente'}</strong>
          </div>
        </div>

        <footer className={styles.cartaoRodape}>
          <div className={styles.medida} aria-label={`${percentual}% da entrega concluída`}>
            <div aria-hidden="true">
              <span style={{ transform: `scaleX(${percentual / 100})` }} />
            </div>
            <strong>{percentual}%</strong>
          </div>
          <span className={styles.prazo}>
            <CalendarDays size={14} strokeWidth={1.7} aria-hidden="true" />
            {formatarPrazo(projeto.prazoEm)}
          </span>
        </footer>
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

export function PainelEntregas({ projetos }: { projetos: ResumoProjetoExecucao[] }) {
  const ativos = projetos.filter((projeto) => projeto.status !== 'concluido');
  const concluidos = projetos.filter((projeto) => projeto.status === 'concluido');
  const emValidacao = ativos.filter((projeto) => projeto.status === 'em_validacao').length;
  const principal = ativos[0] ?? null;
  const demaisAtivos = ativos.slice(1);

  return (
    <div className={styles.pagina}>
      <header className={styles.hero}>
        <span className={styles.heroIcone} aria-hidden="true">
          <ClipboardCheck size={24} strokeWidth={1.6} />
        </span>
        <div className={styles.heroTexto}>
          <p className={styles.eyebrow}>Serviços vendidos</p>
          <h1>Entregas dos clientes</h1>
          <p>
            Veja o que foi combinado, execute a próxima tarefa e registre as evidências até o aceite
            final.
          </p>
        </div>
        <dl className={styles.resumo} aria-label="Resumo das entregas">
          <div>
            <dt>Em andamento</dt>
            <dd>{ativos.length}</dd>
          </div>
          <div>
            <dt>Em validação</dt>
            <dd>{emValidacao}</dd>
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
              <h2 id="titulo-em-andamento">Continue pela próxima tarefa.</h2>
            </div>
            <p>A entrega em destaque é a atualizada mais recentemente.</p>
          </header>

          <CartaoEntrega projeto={principal} destaque />

          {demaisAtivos.length > 0 && (
            <div className={styles.demais}>
              <header>
                <h2>Outras entregas em andamento</h2>
                <span>{demaisAtivos.length}</span>
              </header>
              <ol className={styles.grade}>
                {demaisAtivos.map((projeto) => (
                  <li key={projeto.id}>
                    <CartaoEntrega projeto={projeto} />
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
