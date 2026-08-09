import type { Metadata } from 'next';
import { listarPropostas } from '@/lib/propostas/queries';
import { PainelPropostas } from './_components/PainelPropostas';

export const metadata: Metadata = { title: 'Propostas comerciais' };

export default async function PropostasPage() {
  const propostas = await listarPropostas();
  return <PainelPropostas propostas={propostas} />;
}
