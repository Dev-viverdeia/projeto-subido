'use client';

import { useActionState } from 'react';
import { ArrowUpRight, Check, FileCheck2, MessageSquareMore } from 'lucide-react';
import { decidirEntregaCliente, type EstadoPortalCliente } from '@/lib/portal-cliente/actions';
import type { TarefaPortalCliente } from '@/lib/portal-cliente/servico';
import type { EncerramentoProjeto } from '@/lib/projetos-execucao/encerramento';
import { TermoEncerramentoPortal } from './TermoEncerramentoPortal';
import styles from './portal.module.css';

const INICIAL: EstadoPortalCliente = {};

export function AprovacaoCliente({
  codigo,
  tarefa,
  aceiteFinal = false,
  encerramento,
}: {
  codigo: string;
  tarefa: TarefaPortalCliente;
  aceiteFinal?: boolean;
  encerramento?: EncerramentoProjeto | null;
}) {
  const [estado, acao, pendente] = useActionState(decidirEntregaCliente, INICIAL);

  return (
    <article className={styles.aprovacao} data-final={aceiteFinal || undefined}>
      <div className={styles.aprovacaoTopo}>
        <span className={styles.aprovacaoIcone}>
          <FileCheck2 size={19} aria-hidden="true" />
        </span>
        <div>
          <p>{aceiteFinal ? 'Aceite final do projeto' : tarefa.faseTitulo}</p>
          <h3>{tarefa.titulo}</h3>
        </div>
        <span className={styles.aprovacaoSelo}>Aguardando você</span>
      </div>

      <div className={styles.aprovacaoConteudo}>
        <div className={styles.aprovacaoResumo}>
          <span>O que está sendo validado</span>
          <p className={styles.entregavel}>{tarefa.entregavel}</p>
          <div className={styles.criterioAceite}>
            <span>Confira antes de aprovar</span>
            <p>{tarefa.concluidoQuando}</p>
          </div>
          {tarefa.clienteNota && <blockquote>{tarefa.clienteNota}</blockquote>}
          {tarefa.entregavelUrl && (
            <a href={tarefa.entregavelUrl} target="_blank" rel="noreferrer">
              Abrir o entregável <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          )}
          {aceiteFinal && (
            <small>
              Ao aprovar, você confirma o recebimento da entrega e encerra formalmente o projeto.
            </small>
          )}
        </div>

        {aceiteFinal && encerramento ? (
          <div className={styles.termoAceite}>
            <TermoEncerramentoPortal encerramento={encerramento} compacto />
          </div>
        ) : null}

        <form action={acao}>
          <input type="hidden" name="codigo" value={codigo} />
          <input type="hidden" name="tarefa" value={tarefa.id} />
          <input type="hidden" name="final" value={aceiteFinal ? 'sim' : 'nao'} />
          <label>
            <span>Precisa de ajuste?</span>
            <textarea
              name="comentario"
              maxLength={2000}
              placeholder="Descreva objetivamente o que precisa mudar."
            />
          </label>

          {estado.erro && <p role="alert">{estado.erro}</p>}
          {estado.sucesso && <p role="status">{estado.sucesso}</p>}
          {estado.aviso && (
            <p className={styles.avisoAcao} role="status">
              {estado.aviso}
            </p>
          )}

          <div className={styles.aprovacaoAcoes}>
            <button type="submit" name="decisao" value="ajustes" disabled={pendente}>
              <MessageSquareMore size={15} aria-hidden="true" /> Pedir ajuste
            </button>
            <button
              type="submit"
              name="decisao"
              value="aprovada"
              className={styles.aprovar}
              disabled={pendente}
            >
              <Check size={16} aria-hidden="true" />{' '}
              {pendente ? 'Registrando…' : aceiteFinal ? 'Aprovar e concluir' : 'Aprovar entrega'}
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}
