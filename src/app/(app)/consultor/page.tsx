import type { Metadata } from 'next';
import { listarThreads, obterPainelSobral } from '@/lib/consultor/queries';
import { PainelSobralView } from './_components/PainelSobral';

export const metadata: Metadata = { title: 'Sobral AI' };

export default async function ConsultorPage() {
  const [threads, painel] = await Promise.all([listarThreads(), obterPainelSobral()]);
  return <PainelSobralView threads={threads} painel={painel} />;
}
