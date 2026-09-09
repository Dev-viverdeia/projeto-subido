import { z } from 'zod';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { detalheAtendimento } from '@/lib/suporte/servidor';
import { ConversaAtendimento } from '@/components/suporte/ConversaAtendimento';
import { paginaHistorico } from '@/lib/suporte/contrato';
export const metadata = { title: 'Atender pedido' };
export default async function AtenderPage({
  params,
  searchParams,
}: PageProps<'/suporte/equipe/[id]'>) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const detalhe = await detalheAtendimento(
    id,
    true,
    paginaHistorico((await searchParams).historico),
  );
  if (!detalhe) notFound();
  const db = await createClient();
  const { data: agentes } = await db.from('suporte_agentes').select('usuario,nome,notificar');
  return <ConversaAtendimento {...detalhe} agentes={agentes ?? []} equipe />;
}
