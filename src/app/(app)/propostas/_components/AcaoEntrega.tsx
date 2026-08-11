'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, FolderKanban, LoaderCircle } from 'lucide-react';
import {
  iniciarProjetoExecucao,
  type EstadoProjetoExecucao,
} from '@/lib/projetos-execucao/actions';
import styles from './AcaoEntrega.module.css';

const INICIAL: EstadoProjetoExecucao = {};

export function AcaoEntrega({
  propostaId,
  execucaoId,
}: {
  propostaId: string;
  execucaoId: string | null;
}) {
  const [estado, acao, pendente] = useActionState(iniciarProjetoExecucao, INICIAL);

  if (execucaoId) {
    return (
      <Link href={`/solucoes/execucao/${execucaoId}`} className={styles.abrir}>
        <FolderKanban size={16} aria-hidden="true" /> Continuar projeto
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <div className={styles.raiz}>
      <form action={acao}>
        <input type="hidden" name="proposta" value={propostaId} />
        <button type="submit" className={styles.iniciar} disabled={pendente}>
          {pendente ? (
            <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" />
          ) : (
            <FolderKanban size={16} aria-hidden="true" />
          )}
          {pendente ? 'Criando projeto' : 'Abrir projeto ativo'}
        </button>
      </form>
      {estado.erro && <p role="alert">{estado.erro}</p>}
    </div>
  );
}
