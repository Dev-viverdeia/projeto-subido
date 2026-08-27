import { permanentRedirect } from 'next/navigation';

export default async function ProjetoExecucaoPage({
  params,
}: PageProps<'/solucoes/execucao/[id]'>) {
  const { id } = await params;
  permanentRedirect(`/entregas/${id}`);
}
