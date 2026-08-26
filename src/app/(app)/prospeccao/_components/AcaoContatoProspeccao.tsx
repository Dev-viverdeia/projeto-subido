import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import type { CanalContatoProspeccao } from '@/lib/prospeccao/schema';
import { LinkContatoProspeccao } from './LinkContatoProspeccao';

export function AcaoContatoProspeccao({
  lead,
  canal,
  href,
  children,
}: {
  lead: string;
  canal: CanalContatoProspeccao;
  href: string;
  children: ReactNode;
}) {
  return (
    <LinkContatoProspeccao
      lead={lead}
      canal={canal}
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
    >
      {children}
      <ExternalLink size={13} aria-hidden="true" />
    </LinkContatoProspeccao>
  );
}
