import type { Metadata } from 'next';
import { listarThreads, obterConversaRecente } from '@/lib/consultor/queries';
import { TelaSobral } from './_components/TelaSobral';

export const metadata: Metadata = { title: 'Sobral AI' };

export default async function ConsultorPage() {
  const [threads, conversa] = await Promise.all([listarThreads(), obterConversaRecente()]);

  return <TelaSobral threads={threads} conversa={conversa} />;
}
