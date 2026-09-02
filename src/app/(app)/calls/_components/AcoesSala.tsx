'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, Copy, ListChecks, MoreHorizontal, Video } from 'lucide-react';
import { DropdownMenu } from '@/design-system/via';
import type { TipoCall } from '@/lib/calls/tipos';
import styles from './AcoesSala.module.css';

export function AcoesSala({
  id,
  codigo,
  tipo,
  destaque = false,
}: {
  id: string;
  codigo: string;
  tipo?: TipoCall;
  destaque?: boolean;
}) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);
  const caminho = `/sala/${codigo}`;
  const kickoff = tipo === 'kickoff';
  const rotuloPreparar = kickoff ? 'Preparar kickoff' : 'Preparar reunião';
  const rotuloEntrar = kickoff ? 'Entrar no kickoff' : 'Entrar na sala';

  async function copiar() {
    await navigator.clipboard.writeText(`${window.location.origin}${caminho}`);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1800);
  }

  if (!destaque) {
    return (
      <div className={`${styles.acoes} ${styles.compactas}`}>
        <Link href={`/reunioes/${id}`} className={styles.preparar}>
          <ListChecks size={16} aria-hidden="true" /> {rotuloPreparar}
        </Link>
        <DropdownMenu
          align="end"
          ariaLabel="Outras ações da reunião"
          trigger={
            <button type="button" className={styles.mais} aria-label="Outras ações">
              <MoreHorizontal size={19} aria-hidden="true" />
            </button>
          }
          items={[
            {
              id: 'copiar',
              label: copiado ? 'Link copiado' : 'Copiar link da sala',
              icon: copiado ? <Check size={16} /> : <Copy size={16} />,
              onSelect: () => void copiar(),
            },
            {
              id: 'abrir',
              label: rotuloEntrar,
              icon: <Video size={16} />,
              onSelect: () => router.push(caminho),
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.acoes} ${styles.destaque}`}>
      <Link href={`/reunioes/${id}`} className={styles.preparar}>
        <ListChecks size={15} aria-hidden="true" /> {rotuloPreparar}
      </Link>
      <Link href={caminho} className={styles.entrar}>
        <Video size={15} aria-hidden="true" /> {rotuloEntrar}
      </Link>
    </div>
  );
}
