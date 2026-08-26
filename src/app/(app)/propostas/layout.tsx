import type { ReactNode } from 'react';
import { exigirRecurso } from '@/lib/planos/server';

export default async function PropostasLayout({ children }: { children: ReactNode }) {
  await exigirRecurso('propostas', '/propostas');
  return children;
}
