import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterConversa } from '@/lib/consultor/queries';
import { obterHistorico } from '@/lib/consultor/historico-queries';
import { TelaSobral } from '../_components/TelaSobral';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export async function generateMetadata({
  params,
}: PageProps<'/consultor/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const conversa = await obterConversa(id);
  return { title: conversa?.thread.titulo || 'Conversa · Sobral AI' };
}

export default async function ConversaDoConsultorPage({
  params,
  searchParams,
}: PageProps<'/consultor/[id]'>) {
  const { id } = await params;
  const parametros = await searchParams;
  const alvo = z.uuid().safeParse(parametros.mensagem);
  const mensagemEmFoco = alvo.success ? alvo.data : undefined;
  const supabase = await createClient();
  const [conversa, historico, { data }] = await Promise.all([
    obterConversa(id, mensagemEmFoco),
    obterHistorico(),
    supabase.auth.getClaims(),
  ]);

  if (!conversa) notFound();

  return (
    <TelaSobral
      dono={data?.claims.sub}
      threads={historico?.threads ?? []}
      totalConversas={historico?.total ?? 0}
      conversa={conversa}
      mensagemEmFoco={mensagemEmFoco}
    />
  );
}
