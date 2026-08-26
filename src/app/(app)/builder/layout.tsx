import type { ReactNode } from 'react';
import { exigirRecurso } from '@/lib/planos/server';

export default async function EstudioLayout({ children }: { children: ReactNode }) {
  await exigirRecurso('estudio', '/builder');
  return children;
}
