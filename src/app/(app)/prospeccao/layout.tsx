import type { ReactNode } from 'react';
import { exigirRecurso } from '@/lib/planos/server';

export default async function ProspeccaoLayout({ children }: { children: ReactNode }) {
  await exigirRecurso('modulo_comercial', '/prospeccao');
  return children;
}
