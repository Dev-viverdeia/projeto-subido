import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterProjetoExecucao } from '@/lib/projetos-execucao/queries';
import { SalaEntrega } from '../../_components/SalaEntrega';

export async function generateMetadata({
  params,
}: PageProps<'/solucoes/execucao/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const projeto = await obterProjetoExecucao(id);
  return { title: projeto?.titulo ?? 'Sala de Entrega' };
}

export default async function ProjetoExecucaoPage({
  params,
}: PageProps<'/solucoes/execucao/[id]'>) {
  const { id } = await params;
  const projeto = await obterProjetoExecucao(id);
  if (!projeto) notFound();
  return <SalaEntrega projeto={projeto} />;
}
