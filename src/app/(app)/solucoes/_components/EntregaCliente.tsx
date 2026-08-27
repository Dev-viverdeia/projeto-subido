'use client';

import { useActionState } from 'react';
import {
  ArrowRight,
  Check,
  Clock3,
  ExternalLink,
  MessageSquareMore,
  Send,
  ShieldCheck,
} from 'lucide-react';
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
  aceiteFinal = false,
}: {
  projetoId: string;
  tarefa: TarefaProjetoExecucao;
  portalAtivo: boolean;
  aceiteFinal?: boolean;
}) {
  const [estado, acao, pendente] = useActionState(prepararEntregaCliente, INICIAL);
  const concluida = tarefa.status === 'concluida';
  const decidida = tarefa.clienteStatus === 'aprovada';

  if (!concluida && tarefa.clienteStatus === 'nao_solicitada') return null;

  return (
    <section
      className={styles.entrega}
      data-status={tarefa.clienteStatus}
      data-final={aceiteFinal || undefined}
    >
      <header>
        <span className={styles.icone}>
          <ShieldCheck size={17} aria-hidden="true" />
        </span>
        <div>
          <p>{aceiteFinal ? 'Encerramento do projeto' : 'Validação do cliente'}</p>
          <h2>
            {aceiteFinal && tarefa.clienteStatus === 'nao_solicitada'
              ? 'Aceite final pronto para envio'
              : ROTULO_STATUS_CLIENTE[tarefa.clienteStatus]}
          </h2>
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
        <div
          className={styles.resumo}
          data-aguardando={tarefa.clienteStatus === 'aguardando' || undefined}
        >
          {tarefa.clienteStatus === 'aguardando' && (
            <div className={styles.aguardando}>
              <Clock3 size={17} aria-hidden="true" />
              <span>
                <strong>Agora é com o cliente.</strong>A entrega já está no portal para aprovação ou
                pedido de ajuste.
              </span>
            </div>
          )}
          {tarefa.clienteNota && <p>{tarefa.clienteNota}</p>}
          {tarefa.entregavelUrl && (
            <a href={tarefa.entregavelUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={14} aria-hidden="true" /> Abrir entregável compartilhado
            </a>
          )}
          {decidida && (
            <span>
              <Check size={14} aria-hidden="true" />{' '}
              {aceiteFinal
                ? 'Projeto encerrado com aceite do cliente'
                : 'Confirmação registrada no histórico'}
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
              placeholder={
                aceiteFinal
                  ? 'Resuma o resultado entregue, os materiais finais e como a operação continua.'
                  : 'Diga o que foi concluído e qual resultado o cliente deve conferir.'
              }
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
            {aceiteFinal
              ? 'O aceite do cliente conclui formalmente o projeto. Sua evidência interna continua privada.'
              : 'A evidência interna continua privada. O cliente vê somente a mensagem e o material compartilhado.'}
          </p>

          {!portalAtivo && concluida && (
            <a className={styles.portalPendente} href="#portal-cliente">
              Ative o portal para enviar esta validação
              <ArrowRight size={14} aria-hidden="true" />
            </a>
          )}

          {estado.erro && <p role="alert">{estado.erro}</p>}
          {estado.sucesso && <p role="status">{estado.sucesso}</p>}

          <div className={styles.acoes}>
            <button type="submit" name="operacao" value="salvar" disabled={pendente}>
              {pendente ? 'Salvando…' : 'Salvar mensagem'}
            </button>
            {concluida ? (
              <button
                type="submit"
                name="operacao"
                value="solicitar"
                disabled={pendente || !portalAtivo}
                className={styles.enviar}
              >
                <Send size={14} aria-hidden="true" />{' '}
                {pendente
                  ? 'Enviando…'
                  : aceiteFinal
                    ? 'Solicitar aceite final'
                    : 'Enviar para validação'}
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
