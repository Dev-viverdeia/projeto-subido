import type { ReactNode } from 'react';
import { exigirRecurso } from '@/lib/planos/server';

export default async function VendasLayout({ children }: { children: ReactNode }) {
  await exigirRecurso('modulo_comercial', '/vendas');
  return children;
}
