import type { Enums } from '@/lib/supabase/types.generated';

export type StatusProjetoExecucao = Enums<'projeto_execucao_status'>;
export type StatusTarefaProjeto = Enums<'projeto_tarefa_status'>;

export const ROTULO_STATUS_PROJETO: Record<StatusProjetoExecucao, string> = {
  planejamento: 'Preparando',
  em_execucao: 'Em execução',
  em_validacao: 'Em validação',
  concluido: 'Entregue',
  pausado: 'Pausado',
};

export const ROTULO_STATUS_TAREFA: Record<StatusTarefaProjeto, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  bloqueada: 'Bloqueada',
};
