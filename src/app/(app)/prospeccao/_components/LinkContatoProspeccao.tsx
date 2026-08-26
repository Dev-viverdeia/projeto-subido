'use client';

import { useTransition, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { registrarTentativaContato } from '@/lib/prospeccao/actions';
import type { CanalContatoProspeccao } from '@/lib/prospeccao/schema';

type LinkContatoProspeccaoProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  lead: string;
  canal: CanalContatoProspeccao;
  href: string;
  children: ReactNode;
};

/** Abre o canal sem atraso e registra a tentativa em segundo plano. */
export function LinkContatoProspeccao({
  lead,
  canal,
  href,
  children,
  onClick,
  ...props
}: LinkContatoProspeccaoProps) {
  const [, iniciarRegistro] = useTransition();

  return (
    <a
      {...props}
      href={href}
      onClick={(evento) => {
        onClick?.(evento);
        if (evento.defaultPrevented) return;
        iniciarRegistro(async () => {
          await registrarTentativaContato({ lead, canal });
        });
      }}
    >
      {children}
    </a>
  );
}
