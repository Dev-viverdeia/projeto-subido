import type { ReactNode } from 'react';
import { exigirRecurso } from '@/lib/planos/server';

export default async function MetricasLayout({ children }: { children: ReactNode }) {
  await exigirRecurso('metricas', '/metricas');
  return children;
}
