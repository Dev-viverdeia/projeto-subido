import type { ReactNode } from 'react';
import { ChevronDown, FileCheck2, FileDiff } from 'lucide-react';
import styles from './PortalProjeto.module.css';

/** Recolhe revisões longas sem desmontar o formulário ou perder o texto digitado. */
export function RevisaoPortal({
  titulo,
  tipo,
  primeira,
  agrupar,
  children,
}: {
  titulo: string;
  tipo: 'entrega' | 'mudanca';
  primeira: boolean;
  agrupar: boolean;
  children: ReactNode;
}) {
  if (!agrupar) return children;
  return (
    <details className={styles.revisao} open={primeira}>
      <summary>
        <span className={styles.revisaoIcone} aria-hidden="true">
          {tipo === 'entrega' ? <FileCheck2 size={21} /> : <FileDiff size={21} />}
        </span>
        <span className={styles.revisaoTitulo}>
          <span>{tipo === 'entrega' ? 'Entrega para revisar' : 'Mudança no combinado'}</span>
          <strong>{titulo}</strong>
        </span>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      <div className={styles.revisaoCorpo}>{children}</div>
    </details>
  );
}
