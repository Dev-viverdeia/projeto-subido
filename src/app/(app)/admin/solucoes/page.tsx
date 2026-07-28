import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/design-system/via';
import { createClient } from '@/lib/supabase/server';
import { CabecalhoPagina } from '../../_components/CabecalhoPagina';
import { ListaConteudo } from '../_components/ListaConteudo';

export const metadata: Metadata = { title: 'Soluções · Administração' };

export default async function AdminSoluçõesPage() {
  const supabase = await createClient();
  /* Rascunho primeiro: é o que está esperando alguém terminar. Depois por data de
     alteração, que é a ordem em que se costuma retomar o trabalho. */
  const { data } = await supabase
    .from('solucoes')
    .select('id, titulo, slug, status, atualizado_em')
    .order('status', { ascending: true })
    .order('atualizado_em', { ascending: false });

  return (
    <>
      <CabecalhoPagina
        titulo="Soluções de IA"
        acao={
          <Link href="/admin/solucoes/nova">
            <Button variant="primary">Nova solução</Button>
          </Link>
        }
        oculto
      />
      <ListaConteudo itens={data ?? []} baseHref="/admin/solucoes" rotuloSingular="solução" />
    </>
  );
}
