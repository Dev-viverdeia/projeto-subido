import Link from 'next/link';
import type { ReactNode } from 'react';
import s from './suporte.module.css';

/** Link real com os tokens do DS, independente do carregamento de um botão em outra rota. */
export function LinkAcao({
  href,
  children,
  variant = 'primary',
}: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Link href={href} className={s.linkAcao} data-variant={variant}>
      {children}
    </Link>
  );
}
