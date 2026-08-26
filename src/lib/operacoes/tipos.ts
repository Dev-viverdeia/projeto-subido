import type { Json } from '@/lib/supabase/types.generated';

export type TipoOperacao = 'prospeccao' | 'enriquecimento' | 'pos_call';
export type StatusOperacao = 'pendente' | 'processando' | 'concluida' | 'falhou' | 'cancelada';

export type OperacaoJob = {
  id: string;
  dono: string;
  tipo: TipoOperacao;
  chave_idempotencia: string;
  referencia_tipo: string;
  referencia_id: string;
  payload: Json;
  status: StatusOperacao;
  prioridade: number;
  tentativas: number;
  max_tentativas: number;
  disponivel_em: string;
  bloqueado_ate: string | null;
  bloqueio_id: string | null;
  bloqueado_por: string | null;
  iniciado_em: string | null;
  concluido_em: string | null;
  erro_codigo: string | null;
  erro_mensagem: string | null;
  resultado: Json | null;
  criado_em: string;
  atualizado_em: string;
};
