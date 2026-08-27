'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Copy, ListChecks, Video } from 'lucide-react';
import styles from './AcoesSala.module.css';

export function AcoesSala({
  id,
  codigo,
  destaque = false,
}: {
  id: string;
  codigo: string;
  destaque?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);
  const caminho = `/sala/${codigo}`;

  async function copiar() {
    await navigator.clipboard.writeText(`${window.location.origin}${caminho}`);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <div className={`${styles.acoes} ${destaque ? styles.destaque : ''}`}>
      <Link href={`/reunioes/${id}`} className={styles.preparar}>
        <ListChecks size={15} aria-hidden="true" /> Preparar call
      </Link>
      <button type="button" onClick={() => void copiar()} className={styles.copiar}>
        {copiado ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
        {copiado ? 'Copiado' : 'Copiar link'}
      </button>
      <Link href={caminho} className={styles.entrar}>
        <Video size={15} aria-hidden="true" /> Abrir sala
      </Link>
    </div>
  );
}
