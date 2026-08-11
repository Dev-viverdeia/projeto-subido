import {
  BadgeCheck,
  CirclePause,
  EyeOff,
  FileUp,
  History,
  Link2,
  MessageSquareText,
  Send,
} from 'lucide-react';
import type { EventoProjetoExecucao, TarefaProjetoExecucao } from '@/lib/projetos-execucao/queries';
import styles from './CentralArquivos.module.css';

const ROTULO_EVENTO: Record<EventoProjetoExecucao['tipo'], string> = {
  portal_ativado: 'Portal do cliente ativado',
  portal_desativado: 'Portal do cliente pausado',
  link_rotacionado: 'Link protegido renovado',
  aprovacao_solicitada: 'Entrega enviada para aprovação',
  entrega_aprovada: 'Entrega aprovada pelo cliente',
  ajustes_solicitados: 'Cliente pediu um ajuste',
  arquivo_liberado: 'Arquivo liberado no portal',
  arquivo_retirado: 'Arquivo retirado do portal',
};

function IconeEvento({ tipo }: { tipo: EventoProjetoExecucao['tipo'] }) {
  if (tipo === 'entrega_aprovada') return <BadgeCheck size={17} aria-hidden="true" />;
  if (tipo === 'ajustes_solicitados') return <MessageSquareText size={17} aria-hidden="true" />;
  if (tipo === 'arquivo_liberado') return <FileUp size={17} aria-hidden="true" />;
  if (tipo === 'arquivo_retirado') return <EyeOff size={17} aria-hidden="true" />;
  if (tipo === 'link_rotacionado') return <Link2 size={17} aria-hidden="true" />;
  if (tipo === 'portal_desativado') return <CirclePause size={17} aria-hidden="true" />;
  return <Send size={17} aria-hidden="true" />;
}

function formatarMomento(valor: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
    .format(new Date(valor))
    .replace('.', '');
}

export function HistoricoEntrega({
  eventos,
  tarefas,
}: {
  eventos: EventoProjetoExecucao[];
  tarefas: TarefaProjetoExecucao[];
}) {
  return (
    <section className={styles.historico} aria-labelledby="historico-entrega-titulo">
      <header>
        <div>
          <p>Rastro verificável</p>
          <h3 id="historico-entrega-titulo">Histórico da entrega</h3>
        </div>
        <span>
          <History size={15} aria-hidden="true" /> {eventos.length}{' '}
          {eventos.length === 1 ? 'movimento' : 'movimentos'}
        </span>
      </header>

      {eventos.length ? (
        <ol>
          {eventos.slice(0, 8).map((evento) => {
            const tarefa = tarefas.find((item) => item.id === evento.tarefaId);
            return (
              <li key={evento.id} data-cliente={evento.autor === 'cliente' || undefined}>
                <span className={styles.iconeEvento}>
                  <IconeEvento tipo={evento.tipo} />
                </span>
                <div>
                  <strong>{ROTULO_EVENTO[evento.tipo]}</strong>
                  <small>
                    {tarefa ? `${tarefa.faseTitulo} · ${tarefa.titulo}` : 'Projeto geral'}
                  </small>
                  {evento.comentario && <p>{evento.comentario}</p>}
                </div>
                <time dateTime={evento.criadoEm}>{formatarMomento(evento.criadoEm)}</time>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className={styles.historicoVazio}>
          <History size={20} aria-hidden="true" />
          <p>Liberações e aprovações aparecerão aqui automaticamente.</p>
        </div>
      )}
    </section>
  );
}
