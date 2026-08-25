import type { ReactNode } from 'react';
import { exigirRecurso } from '@/lib/planos/server';

export default async function PropostasLayout({ children }: { children: ReactNode }) {
  await exigirRecurso('modulo_comercial', '/propostas');
  return children;
}
