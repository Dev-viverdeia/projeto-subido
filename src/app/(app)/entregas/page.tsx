import type { Metadata } from 'next';
import { listarProjetosExecucao } from '@/lib/projetos-execucao/queries';
import { PainelEntregas } from './_components/PainelEntregas';

export const metadata: Metadata = { title: 'Entregas' };

export default async function EntregasPage() {
  const projetos = await listarProjetosExecucao();
  return <PainelEntregas projetos={projetos} />;
}
