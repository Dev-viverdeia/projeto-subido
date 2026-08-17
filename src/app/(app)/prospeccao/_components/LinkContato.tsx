'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { registrarContatoProspeccao } from '@/lib/prospeccao/actions';
import type { CanalContatoProspeccao } from '@/lib/prospeccao/schema';
import styles from './ModalProspeccao.module.css';

export function LinkContato({
  lead,
  canal,
  href,
  children,
  ariaLabel,
}: {
  lead: string;
  canal: CanalContatoProspeccao;
  href: string;
  children: ReactNode;
  ariaLabel: string;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [falhou, setFalhou] = useState(false);

  return (
    <a
      href={href}
      target={href.startsWith('tel:') || href.startsWith('mailto:') ? undefined : '_blank'}
      rel="noreferrer"
      aria-label={ariaLabel}
      data-falhou={falhou || undefined}
      onClick={() => {
        setFalhou(false);
        iniciar(async () => {
          const resultado = await registrarContatoProspeccao({
            lead,
            canal,
            status: 'tentando_contato',
          });
          if (!resultado.ok) setFalhou(true);
          else router.refresh();
        });
      }}
    >
      {pendente ? <LoaderCircle className={styles.girando} size={15} aria-hidden="true" /> : null}
      {children}
    </a>
  );
}
