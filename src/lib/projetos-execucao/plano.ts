import type { Tables } from '@/lib/supabase/types.generated';

export type AcaoPlanoProjeto = {
  id: string;
  titulo: string;
  prazoEm: string | null;
  status: Tables<'projeto_acoes'>['status'];
  origem: string;
  categoria: 'proxima_acao' | 'compromisso' | 'acesso' | 'dependencia';
  reuniaoId: string | null;
  responsavelTipo: 'cliente' | 'prestador';
  responsavelNome: string | null;
  visivelCliente: boolean;
  concluidaEm: string | null;
  atualizadoEm: string;
};
