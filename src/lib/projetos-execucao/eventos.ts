import type { Tables } from '@/lib/supabase/types.generated';
import { recuperacaoEmail } from '@/lib/notificacoes/estado-email';
import type { StatusEmailEntrega } from '@/lib/notificacoes/entrega';
import type { EventoProjetoExecucao } from './queries';

export type TipoEventoProjeto =
  | 'portal_ativado'
  | 'portal_desativado'
  | 'link_rotacionado'
  | 'aprovacao_solicitada'
  | 'lembrete_aprovacao'
  | 'entrega_aprovada'
  | 'ajustes_solicitados'
  | 'arquivo_liberado'
  | 'arquivo_retirado'
  | 'pendencia_concluida'
  | 'mudanca_escopo_solicitada'
  | 'mudanca_escopo_incluida'
  | 'mudanca_escopo_proposta'
  | 'mudanca_escopo_aprovada'
  | 'mudanca_escopo_recusada'
  | 'encerramento_enviado'
  | 'projeto_encerrado'
  | 'revisao_resultado_registrada';

export function mapearEventosProjeto(
  eventos: Tables<'projeto_portal_eventos'>[],
): EventoProjetoExecucao[] {
  return eventos
    .flatMap((evento): EventoProjetoExecucao[] => {
      if (evento.autor !== 'prestador' && evento.autor !== 'cliente') return [];
      return [
        {
          id: evento.id,
          tarefaId: evento.tarefa_id,
          mudancaEscopoId: evento.mudanca_escopo_id,
          tipo: evento.tipo as TipoEventoProjeto,
          autor: evento.autor,
          comentario: evento.comentario,
          criadoEm: evento.criado_em,
          emailDestinatario: evento.email_destinatario,
          emailStatus: evento.email_status as StatusEmailEntrega,
          emailRecuperacao: recuperacaoEmail(evento),
          emailTentativas: evento.email_tentativas,
          emailEnviadoEm: evento.email_enviado_em,
          emailEntregueEm: evento.email_entregue_em,
          emailOrigemEventoId: evento.email_origem_evento_id,
        },
      ];
    })
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}
