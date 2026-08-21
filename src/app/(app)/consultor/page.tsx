import type { Metadata } from 'next';
import { listarThreads } from '@/lib/consultor/queries';
import { TelaSobral } from './_components/TelaSobral';

export const metadata: Metadata = { title: 'Sobral AI' };

export default async function ConsultorPage() {
  const threads = await listarThreads();
  return <TelaSobral threads={threads} conversa={null} />;
}
