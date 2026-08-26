'use client';

import { useFormStatus } from 'react-dom';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import styles from './page.module.css';

export function BotaoBilling({
  texto,
  processando,
  variante = 'primario',
}: {
  texto: string;
  processando: string;
  variante?: 'primario' | 'secundario';
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={styles.botaoBilling}
      data-variante={variante}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <LoaderCircle size={17} strokeWidth={1.8} className={styles.girando} aria-hidden="true" />
      ) : null}
      <span>{pending ? processando : texto}</span>
      {!pending ? <ArrowRight size={16} strokeWidth={1.9} aria-hidden="true" /> : null}
    </button>
  );
}
