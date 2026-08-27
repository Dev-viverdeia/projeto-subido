import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterProjetoExecucao } from '@/lib/projetos-execucao/queries';
import { SalaEntrega } from '../../solucoes/_components/SalaEntrega';

export async function generateMetadata({ params }: PageProps<'/entregas/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const projeto = await obterProjetoExecucao(id);
  return { title: projeto?.titulo ?? 'Entrega do cliente' };
}

export default async function EntregaPage({ params }: PageProps<'/entregas/[id]'>) {
  const { id } = await params;
  const projeto = await obterProjetoExecucao(id);
  if (!projeto) notFound();
  return <SalaEntrega projeto={projeto} />;
}
