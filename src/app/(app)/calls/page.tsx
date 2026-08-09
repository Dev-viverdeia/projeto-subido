import type { Metadata } from 'next';
import { listarReunioes } from '@/lib/calls/queries';
import { listarOportunidadesSeletor } from '@/lib/crm/queries';
import { PainelCalls } from './_components/PainelCalls';

export const metadata: Metadata = { title: 'Calls' };

export default async function CallsPage({ searchParams }: PageProps<'/calls'>) {
  const [reunioes, oportunidades, parametros] = await Promise.all([
    listarReunioes(),
    listarOportunidadesSeletor(),
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
