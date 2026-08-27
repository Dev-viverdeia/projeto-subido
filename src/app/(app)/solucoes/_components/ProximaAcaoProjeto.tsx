'use client';

import { ArrowRight } from 'lucide-react';
import styles from './SalaEntrega.module.css';

export function ProximaAcaoProjeto({
  concluido,
  validacao,
  compromisso,
  tarefa,
  onAbrir,
}: {
  concluido: boolean;
  validacao: 'nao_solicitada' | 'aguardando' | 'aprovada' | 'ajustes' | null;
  compromisso: string | null;
  tarefa: { titulo: string; faseTitulo: string } | null;
  onAbrir: () => void;
}) {
  return (
    <button type="button" className={styles.proximaAcao} onClick={onAbrir}>
      <p>
        {concluido
          ? 'Projeto concluído'
          : validacao === 'aguardando'
            ? 'Aceite final pendente'
            : compromisso
              ? 'Próximo compromisso'
              : 'Próxima tarefa'}
      </p>
      {concluido ? (
        <>
          <strong>Entrega aceita pelo cliente</strong>
          <span>
            Revisar encerramento <ArrowRight size={15} aria-hidden="true" />
          </span>
        </>
      ) : validacao === 'aguardando' ? (
        <>
          <strong>Aguardando o cliente</strong>
          <span>
            Abrir entrega final <ArrowRight size={15} aria-hidden="true" />
          </span>
        </>
      ) : compromisso ? (
        <>
          <strong>{compromisso}</strong>
          <span>
            Abrir plano vivo <ArrowRight size={15} aria-hidden="true" />
          </span>
        </>
      ) : tarefa ? (
        <>
          <strong>{tarefa.titulo}</strong>
          <span>
            {tarefa.faseTitulo} <ArrowRight size={15} aria-hidden="true" />
          </span>
        </>
      ) : (
        <>
          <strong>Formalizar a entrega final</strong>
          <span>
            Abrir aceite final <ArrowRight size={15} aria-hidden="true" />
          </span>
        </>
      )}
    </button>
  );
}
