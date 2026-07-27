import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/design-system/via';
import { createClient } from '@/lib/supabase/server';
import { CabecalhoPagina } from '../../_components/CabecalhoPagina';
import { ListaConteudo } from '../_components/ListaConteudo';

export const metadata: Metadata = { title: 'Formações · Administração' };

export default async function AdminFormaçõesPage() {
  const supabase = await createClient();
  /* Rascunho primeiro: é o que está esperando alguém terminar. Depois por data de
     alteração, que é a ordem em que se costuma retomar o trabalho. */
  const { data } = await supabase
    .from('formacoes')
    .select('id, titulo, slug, status, atualizado_em')
    .order('status', { ascending: true })
    .order('atualizado_em', { ascending: false });

  return (
    <>
      <CabecalhoPagina
        titulo="Formações"
        descricao="Rascunho fica invisível para os assinantes. Publicado entra no catálogo."
        acao={
          <Link href="/admin/formacoes/nova">
            <Button variant="primary">Nova formação</Button>
          </Link>
        }
      />
      <ListaConteudo itens={data ?? []} baseHref="/admin/formacoes" rotuloSingular="formação" />
    </>
  );
}
