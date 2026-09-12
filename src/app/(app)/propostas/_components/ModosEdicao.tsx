import type { ReactNode } from 'react';
import { Eye, Pencil } from 'lucide-react';
import styles from './EditorProposta.module.css';

export function ModosEdicao({
  painel,
  pronto,
  editar,
  verPrevia,
  salvar,
}: {
  painel: 'editar' | 'preview';
  pronto: boolean;
  editar: () => void;
  verPrevia: () => void;
  salvar: ReactNode;
}) {
  return (
    <div className={styles.modos}>
      <div className={styles.abasModo} role="group" aria-label="Área de trabalho da proposta">
        <button
          type="button"
          aria-pressed={painel === 'editar'}
          disabled={!pronto}
          onClick={editar}
        >
          <Pencil size={15} strokeWidth={1.8} aria-hidden="true" /> Editar
        </button>
        <button
          type="button"
          aria-pressed={painel === 'preview'}
          disabled={!pronto}
          onClick={verPrevia}
        >
          <Eye size={16} strokeWidth={1.8} aria-hidden="true" /> Ver prévia
        </button>
      </div>
      {salvar}
    </div>
  );
}
