'use client';

import { useActionState } from 'react';
import { Check, MessageSquareMore } from 'lucide-react';
import { decidirEntregaCliente, type EstadoPortalCliente } from '@/lib/portal-cliente/actions';
import type { TarefaPortalCliente } from '@/lib/portal-cliente/servico';
import styles from './portal.module.css';

const INICIAL: EstadoPortalCliente = {};

export function AprovacaoCliente({
  codigo,
  tarefa,
}: {
  codigo: string;
  tarefa: TarefaPortalCliente;
}) {
  const [estado, acao, pendente] = useActionState(decidirEntregaCliente, INICIAL);

  return (
    <article className={styles.aprovacao}>
      <div className={styles.aprovacaoTopo}>
        <div>
          <p>{tarefa.faseTitulo}</p>
          <h2>{tarefa.titulo}</h2>
        </div>
        <span>Aguardando você</span>
      </div>

      <p className={styles.entregavel}>{tarefa.entregavel}</p>
      {tarefa.clienteNota && <blockquote>{tarefa.clienteNota}</blockquote>}
      {tarefa.entregavelUrl && (
        <a href={tarefa.entregavelUrl} target="_blank" rel="noreferrer">
          Abrir o entregável
        </a>
      )}

      <form action={acao}>
        <input type="hidden" name="codigo" value={codigo} />
        <input type="hidden" name="tarefa" value={tarefa.id} />
        <label>
          <span>Se precisar de ajuste, descreva aqui</span>
          <textarea
            name="comentario"
            maxLength={2000}
            placeholder="Ex.: incluir o cenário de atendimento fora do horário comercial."
          />
        </label>

        {estado.erro && <p role="alert">{estado.erro}</p>}
        {estado.sucesso && <p role="status">{estado.sucesso}</p>}

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
            <Check size={16} aria-hidden="true" /> {pendente ? 'Registrando…' : 'Aprovar entrega'}
          </button>
        </div>
      </form>
    </article>
  );
}
