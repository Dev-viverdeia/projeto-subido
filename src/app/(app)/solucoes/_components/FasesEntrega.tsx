import { Check } from 'lucide-react';
import type { TarefaProjetoExecucao } from '@/lib/projetos-execucao/queries';
import styles from './SalaEntrega.module.css';

export function FasesEntrega({
  fases,
  faseAtualId,
  onAbrir,
}: {
  fases: Array<{ id: string; titulo: string; tarefas: TarefaProjetoExecucao[] }>;
  faseAtualId: string | undefined;
  onAbrir: (faseId: string) => void;
}) {
  return (
    <nav className={styles.fases} aria-label="Fases da entrega">
      {fases.map((fase, indice) => {
        const feitas = fase.tarefas.filter((tarefa) => tarefa.status === 'concluida').length;
        const completa = feitas === fase.tarefas.length;
        const ativa = fase.id === faseAtualId;
        return (
          <button
            type="button"
            key={fase.id}
            data-ativa={ativa || undefined}
            data-completa={completa || undefined}
            aria-current={ativa ? 'step' : undefined}
            onClick={() => onAbrir(fase.id)}
          >
            <span>{completa ? <Check size={13} /> : String(indice + 1).padStart(2, '0')}</span>
            <strong>{fase.titulo}</strong>
            <small>
              {feitas}/{fase.tarefas.length}
            </small>
          </button>
        );
      })}
    </nav>
  );
}
