import { ArrowUpRight, Check, ChevronDown, MessageSquareText } from 'lucide-react';
import type { ProjetoPortalCliente, TarefaPortalCliente } from '@/lib/portal-cliente/tipos';
import styles from './PortalProjeto.module.css';

function Entrega({ tarefa }: { tarefa: TarefaPortalCliente }) {
  const aprovada = tarefa.clienteStatus === 'aprovada';
  return (
    <li className={styles.entrega}>
      <span className={styles.entregaIcone} aria-hidden="true">
        {aprovada ? <Check size={19} /> : <MessageSquareText size={19} />}
      </span>
      <div>
        <span className={styles.apoio}>{aprovada ? 'Aprovada por você' : 'Ajuste solicitado'}</span>
        <h3>{tarefa.titulo}</h3>
        {(tarefa.clienteNota || tarefa.comentario) && (
          <details className={styles.nota}>
            <summary>
              Ver observações <ChevronDown size={14} aria-hidden="true" />
            </summary>
            {tarefa.clienteNota && <p>{tarefa.clienteNota}</p>}
            {tarefa.comentario && <blockquote>{tarefa.comentario}</blockquote>}
          </details>
        )}
      </div>
      {tarefa.entregavelUrl && (
        <a
          className={styles.linkEntrega}
          href={tarefa.entregavelUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Abrir entrega: ${tarefa.titulo}`}
        >
          Abrir <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      )}
    </li>
  );
}

export function EntregasPortal({ projeto }: { projeto: ProjetoPortalCliente }) {
  const compartilhadas = projeto.tarefas.filter((tarefa) =>
    ['aprovada', 'ajustes'].includes(tarefa.clienteStatus),
  );
  if (!compartilhadas.length) return null;
  // Ordem inversa à execução; todos os registros permanecem acessíveis.
  const recentes = [...compartilhadas].reverse();
  return (
    <section className={styles.entregas} aria-labelledby="entregas-titulo">
      <header className={styles.tituloSecao}>
        <h2 id="entregas-titulo">Entregas compartilhadas</h2>
        <span>{recentes.length}</span>
      </header>
      <ol>
        {recentes.slice(0, 1).map((tarefa) => (
          <Entrega key={tarefa.id} tarefa={tarefa} />
        ))}
      </ol>
      {recentes.length > 1 && (
        <details className={styles.mais}>
          <summary>
            Ver mais {recentes.length - 1} {recentes.length === 2 ? 'entrega' : 'entregas'}{' '}
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <ol>
            {recentes.slice(1).map((tarefa) => (
              <Entrega key={tarefa.id} tarefa={tarefa} />
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
