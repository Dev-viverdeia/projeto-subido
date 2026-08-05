import Link from 'next/link';
import { dataCurta } from '../../builder/_components/statusBuilder';
import type { ThreadDoConsultor } from '@/lib/consultor/queries';
import styles from './ListaConversas.module.css';

/**
 * As conversas anteriores, para o dropdown do canto — Server Component puro.
 * Data ao lado do título: numa lista de perguntas parecidas, o "quando" é o
 * que distingue. `--i` alimenta a cascata do dropdown, como no Builder.
 */
export function ListaConversas({
  threads,
  atualId,
}: {
  threads: ThreadDoConsultor[];
  atualId?: string;
}) {
  return (
    <ul className={styles.lista}>
      {threads.map((t, indice) => (
        <li key={t.id} style={{ '--i': indice } as React.CSSProperties}>
          <Link
            href={`/consultor/${t.id}`}
            className={styles.conversa}
            aria-current={t.id === atualId ? 'page' : undefined}
          >
            <span className={styles.titulo}>{t.titulo}</span>
            <span className={styles.data}>{dataCurta(t.atualizadoEm)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
