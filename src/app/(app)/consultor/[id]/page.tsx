import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listarThreads, obterConversa } from '@/lib/consultor/queries';
import { TelaSobral } from '../_components/TelaSobral';

export async function generateMetadata({
  params,
}: PageProps<'/consultor/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const conversa = await obterConversa(id);
  return { title: conversa?.thread.titulo || 'Conversa · Sobral AI' };
}

export default async function ConversaDoConsultorPage({ params }: PageProps<'/consultor/[id]'>) {
  const { id } = await params;
  const [conversa, threads] = await Promise.all([obterConversa(id), listarThreads()]);

  if (!conversa) notFound();

  return <TelaSobral threads={threads} conversa={conversa} />;
}
