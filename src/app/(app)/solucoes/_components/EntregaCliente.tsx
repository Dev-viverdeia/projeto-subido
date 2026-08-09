'use client';

import { useActionState } from 'react';
import { Check, ExternalLink, MessageSquareMore, Send, ShieldCheck } from 'lucide-react';
import {
  prepararEntregaCliente,
  type EstadoProjetoExecucao,
} from '@/lib/projetos-execucao/actions';
import type { TarefaProjetoExecucao } from '@/lib/projetos-execucao/queries';
import { ROTULO_STATUS_CLIENTE } from '@/lib/projetos-execucao/status';
import styles from './EntregaCliente.module.css';

const INICIAL: EstadoProjetoExecucao = {};

export function EntregaCliente({
  projetoId,
  tarefa,
  portalAtivo,
}: {
  projetoId: string;
  tarefa: TarefaProjetoExecucao;
  portalAtivo: boolean;
}) {
  const [estado, acao, pendente] = useActionState(prepararEntregaCliente, INICIAL);
  const concluida = tarefa.status === 'concluida';
  const decidida = tarefa.clienteStatus === 'aprovada';

  if (!concluida && tarefa.clienteStatus === 'nao_solicitada') return null;

  return (
    <section className={styles.entrega} data-status={tarefa.clienteStatus}>
      <header>
        <span className={styles.icone}>
          <ShieldCheck size={17} aria-hidden="true" />
        </span>
        <div>
          <p>Apresentação ao cliente</p>
          <h2>{ROTULO_STATUS_CLIENTE[tarefa.clienteStatus]}</h2>
        </div>
        <span className={styles.selo}>{portalAtivo ? 'Portal ativo' : 'Portal privado'}</span>
      </header>

      {tarefa.clienteStatus === 'ajustes' && tarefa.clienteComentario && (
        <blockquote>
          <MessageSquareMore size={16} aria-hidden="true" />
          <span>
            <strong>Retorno do cliente</strong>
            {tarefa.clienteComentario}
          </span>
        </blockquote>
      )}

      {decidida || tarefa.clienteStatus === 'aguardando' ? (
        <div className={styles.resumo}>
          {tarefa.clienteNota && <p>{tarefa.clienteNota}</p>}
          {tarefa.entregavelUrl && (
            <a href={tarefa.entregavelUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={14} aria-hidden="true" /> Abrir entregável compartilhado
            </a>
          )}
          {decidida && (
            <span>
              <Check size={14} aria-hidden="true" /> Confirmação registrada no histórico
            </span>
          )}
        </div>
      ) : (
        <form action={acao}>
          <input type="hidden" name="projeto" value={projetoId} />
          <input type="hidden" name="tarefa" value={tarefa.id} />
          <label>
            <span>Mensagem para o cliente</span>
            <textarea
              name="nota"
              defaultValue={tarefa.clienteNota ?? ''}
              maxLength={4000}
              placeholder="Explique o que foi entregue, como validar e o que muda a partir daqui."
            />
          </label>
          <label>
            <span>Link compartilhável do entregável</span>
            <input
              type="url"
              name="url"
              defaultValue={tarefa.entregavelUrl ?? ''}
              maxLength={2048}
              placeholder="https://"
            />
          </label>

          <p className={styles.privacidade}>
            Sua evidência interna continua privada. Só estes dois campos aparecem no portal.
          </p>

          {estado.erro && <p role="alert">{estado.erro}</p>}
          {estado.sucesso && <p role="status">{estado.sucesso}</p>}

          <div className={styles.acoes}>
            <button type="submit" name="operacao" value="salvar" disabled={pendente}>
              Salvar apresentação
            </button>
            {concluida ? (
              <button
                type="submit"
                name="operacao"
                value="solicitar"
                disabled={pendente || !portalAtivo}
                className={styles.enviar}
              >
                <Send size={14} aria-hidden="true" /> Solicitar aprovação
              </button>
            ) : (
              <span>Conclua os ajustes para reenviar.</span>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
