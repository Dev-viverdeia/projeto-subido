import type { Metadata } from 'next';
import { carregarMetricasComerciais } from '@/lib/metricas/queries';
import { lerPeriodoMetricas } from '@/lib/metricas/modelo';
import { PainelMetricas } from './_components/PainelMetricas';

export const metadata: Metadata = { title: 'Métricas comerciais' };

export default async function MetricasPage({ searchParams }: PageProps<'/metricas'>) {
  const parametros = await searchParams;
  const periodo = lerPeriodoMetricas(parametros.periodo);
  const metricas = await carregarMetricasComerciais(periodo);

  return <PainelMetricas metricas={metricas} />;
}
