import { Check, Clock3 } from 'lucide-react';
import type { EventoPortalCliente, ProjetoPortalCliente } from '@/lib/portal-cliente/tipos';
import { dataPortal } from './CabecalhoPortal';
import styles from './PortalProjeto.module.css';

const ROTULOS: Record<EventoPortalCliente['tipo'], string> = {
  aprovacao_solicitada: 'Entrega pronta para sua revisão',
  entrega_aprovada: 'Entrega aprovada por você',
  ajustes_solicitados: 'Ajuste solicitado',
  arquivo_liberado: 'Novo arquivo disponível',
  pendencia_concluida: 'Pendência confirmada pelo cliente',
  mudanca_escopo_solicitada: 'Mudança solicitada pelo cliente',
  mudanca_escopo_incluida: 'Mudança confirmada no combinado',
  mudanca_escopo_proposta: 'Impacto enviado para decisão',
  mudanca_escopo_aprovada: 'Mudança aprovada pelo cliente',
  mudanca_escopo_recusada: 'Combinado original mantido',
  encerramento_enviado: 'Encerramento enviado para aceite',
  projeto_encerrado: 'Projeto encerrado com aceite',
  revisao_resultado_registrada: 'Resultado revisado com o cliente',
};

export function HistoricoPortal({ projeto }: { projeto: ProjetoPortalCliente }) {
  return (
    <ol className={styles.historico} aria-label="Histórico do projeto">
      {projeto.eventos.map((evento) => {
        const tarefa = projeto.tarefas.find((item) => item.id === evento.tarefaId);
        const mudanca = projeto.mudancasEscopo.find((item) => item.id === evento.mudancaEscopoId);
        return (
          <li key={evento.id}>
            <span aria-hidden="true">
              {evento.tipo === 'entrega_aprovada' || evento.tipo === 'projeto_encerrado' ? (
                <Check size={18} />
              ) : (
                <Clock3 size={18} />
              )}
            </span>
            <div>
              <strong>{ROTULOS[evento.tipo]}</strong>
              <span>{tarefa?.titulo ?? mudanca?.titulo ?? 'Projeto geral'}</span>
              {evento.comentario && <p>{evento.comentario}</p>}
            </div>
            <time dateTime={evento.criadoEm}>{dataPortal(evento.criadoEm)}</time>
          </li>
        );
      })}
    </ol>
  );
}
