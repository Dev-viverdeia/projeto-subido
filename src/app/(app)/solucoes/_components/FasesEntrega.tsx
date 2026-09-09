import { Check, ChevronRight, LockKeyhole } from 'lucide-react';
import type { TarefaProjetoExecucao } from '@/lib/projetos-execucao/queries';
import { ROTULO_STATUS_TAREFA } from '@/lib/projetos-execucao/status';
import styles from './FasesEntrega.module.css';

export function FasesEntrega({
  fases,
  faseAtualId,
  tarefaAtualId,
  onAbrir,
  onAbrirTarefa,
}: {
  fases: Array<{ id: string; titulo: string; tarefas: TarefaProjetoExecucao[] }>;
  faseAtualId: string | undefined;
  tarefaAtualId: string | undefined;
  onAbrir: (faseId: string) => void;
  onAbrirTarefa: (tarefaId: string) => void;
}) {
  const faseAtual = fases.find((fase) => fase.id === faseAtualId);
  return (
    <nav className={styles.fases} aria-label="Fases da entrega">
      <div className={styles.compacta}>
        <label>
          Etapa
          <select value={faseAtualId ?? ''} onChange={(event) => onAbrir(event.target.value)}>
            {fases.map((fase) => (
              <option key={fase.id} value={fase.id}>
                {fase.titulo} · {fase.tarefas.filter((t) => t.status === 'concluida').length}/
                {fase.tarefas.length}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tarefa
          <select
            value={tarefaAtualId ?? ''}
            onChange={(event) => onAbrirTarefa(event.target.value)}
          >
            {faseAtual?.tarefas.map((tarefa) => (
              <option key={tarefa.id} value={tarefa.id}>
                {tarefa.titulo} · {ROTULO_STATUS_TAREFA[tarefa.status]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.trilha}>
        <h2>Etapas do projeto</h2>
        <ol>
          {fases.map((fase) => {
            const feitas = fase.tarefas.filter((tarefa) => tarefa.status === 'concluida').length;
            const completa = feitas === fase.tarefas.length;
            const ativa = fase.id === faseAtualId;
            return (
              <li key={fase.id} data-ativa={ativa || undefined}>
                <button
                  type="button"
                  className={styles.fase}
                  data-ativa={ativa || undefined}
                  data-completa={completa || undefined}
                  aria-current={ativa ? 'step' : undefined}
                  onClick={() => onAbrir(fase.id)}
                >
                  <span aria-hidden="true">
                    {completa ? <Check size={17} /> : <ChevronRight size={17} />}
                  </span>
                  <strong>{fase.titulo}</strong>
                  <small>
                    {feitas}/{fase.tarefas.length}
                  </small>
                </button>
                {ativa && (
                  <ol className={styles.tarefas} aria-label={`Tarefas de ${fase.titulo}`}>
                    {fase.tarefas.map((tarefa) => (
                      <li key={tarefa.id}>
                        <button
                          type="button"
                          aria-current={tarefa.id === tarefaAtualId ? 'step' : undefined}
                          aria-label={`${tarefa.id === tarefaAtualId ? 'Tarefa atual' : 'Abrir tarefa'} ${tarefa.titulo}`}
                          data-concluida={tarefa.status === 'concluida' || undefined}
                          onClick={() => onAbrirTarefa(tarefa.id)}
                        >
                          <span className={styles.marca} aria-hidden="true">
                            {tarefa.status === 'concluida' ? (
                              <Check size={14} />
                            ) : tarefa.status === 'bloqueada' ? (
                              <LockKeyhole size={14} />
                            ) : null}
                          </span>
                          <span>
                            <strong>{tarefa.titulo}</strong>
                            <small>{ROTULO_STATUS_TAREFA[tarefa.status]}</small>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
