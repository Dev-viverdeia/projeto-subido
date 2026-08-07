import type { Metadata } from 'next';
import { listarReunioes } from '@/lib/calls/queries';
import { listarPipeline } from '@/lib/crm/queries';
import { PainelCalls } from './_components/PainelCalls';

export const metadata: Metadata = { title: 'Calls' };

export default async function CallsPage({ searchParams }: PageProps<'/calls'>) {
  const [reunioes, oportunidades, parametros] = await Promise.all([
    listarReunioes(),
    listarPipeline(),
    searchParams,
  ]);

  return (
    <PainelCalls
      reunioes={reunioes}
      oportunidades={oportunidades}
      agendada={parametros.agendada === 'ok'}
    />
  );
}
