import { ArrowRight, Clock3, KeyRound } from 'lucide-react';
import type { ProjetoExecucaoCompleto } from '@/lib/projetos-execucao/queries';
import type { DestinoJornadaEntrega } from '@/lib/projetos-execucao/jornada-entrega';
import styles from './PendenciasClienteEntrega.module.css';

function itensCliente(projeto: ProjetoExecucaoCompleto) {
  return [
    ...projeto.tarefas
      .filter((t) => t.clienteStatus === 'aguardando')
      .map((t) => ({
        id: t.id,
        titulo: t.titulo,
        tipo: 'Validação',
        destino: 'validacao' as const,
        tarefa: t.id,
        Icone: Clock3,
        acao: 'Ver validação',
      })),
    ...projeto.acoesPlano
      .filter((a) => a.status === 'pendente' && a.responsavelTipo === 'cliente')
      .map((a) => ({
        id: a.id,
        titulo: a.titulo,
        tipo:
          a.categoria === 'acesso'
            ? 'Acesso'
            : a.categoria === 'dependencia'
              ? 'Preparação'
              : 'Compromisso',
        destino: ['acesso', 'dependencia'].includes(a.categoria)
          ? ('preparacao' as const)
          : ('compromisso' as const),
        tarefa: null,
        Icone: KeyRound,
        acao: ['acesso', 'dependencia'].includes(a.categoria)
          ? 'Ver preparação'
          : 'Ver compromisso',
      })),
    ...projeto.mudancasEscopo
      .filter((m) => m.status === 'aguardando_cliente')
      .map((m) => ({
        id: m.id,
        titulo: m.titulo,
        tipo: 'Escopo',
        destino: 'escopo' as const,
        tarefa: null,
        Icone: Clock3,
        acao: 'Ver mudança',
      })),
  ];
}

export function contarPendenciasCliente(projeto: ProjetoExecucaoCompleto) {
  return itensCliente(projeto).length;
}

export function PendenciasClienteEntrega({
  projeto,
  onAbrir,
}: {
  projeto: ProjetoExecucaoCompleto;
  onAbrir: (destino: DestinoJornadaEntrega, tarefa: string | null) => void;
}) {
  const itens = itensCliente(projeto);
  if (!itens.length) return null;
  return (
    <section className={styles.pendencias} aria-labelledby="pendencias-cliente-titulo">
      <header>
        <h2 id="pendencias-cliente-titulo">Com o cliente</h2>
        <span>
          {itens.length} {itens.length === 1 ? 'pendência' : 'pendências'}
        </span>
      </header>
      <ul>
        {itens.map(({ id, titulo, tipo, destino, tarefa, Icone, acao }) => (
          <li key={id}>
            <span className={styles.icone}>
              <Icone size={20} aria-hidden="true" />
            </span>
            <div>
              <span>{tipo}</span>
              <strong>{titulo}</strong>
            </div>
            <button
              type="button"
              onClick={() => onAbrir(destino, tarefa)}
              aria-label={`${acao}: ${titulo}`}
            >
              {acao}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
