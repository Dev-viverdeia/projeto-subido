import type { Metadata } from 'next';
import { listarFormacoes } from '@/lib/conteudo/queries';
import { FormacoesVista } from './_components/FormacoesVista';

export const metadata: Metadata = { title: 'Formações' };

export default async function FormacoesPage() {
  const formacoes = await listarFormacoes();
  return <FormacoesVista formacoes={formacoes} />;
}
