import { z } from 'zod';
import { notFound } from 'next/navigation';
import { detalheAtendimento } from '@/lib/suporte/servidor';
import { ConversaAtendimento } from '@/components/suporte/ConversaAtendimento';
import { paginaHistorico } from '@/lib/suporte/contrato';
export const metadata = { title: 'Atendimento' };
export default async function AtendimentoPage({
  params,
  searchParams,
}: PageProps<'/suporte/[id]'>) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const detalhe = await detalheAtendimento(
    id,
    false,
    paginaHistorico((await searchParams).historico),
  );
  if (!detalhe) notFound();
  return <ConversaAtendimento {...detalhe} />;
}
