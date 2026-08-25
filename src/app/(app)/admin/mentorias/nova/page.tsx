import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { CabecalhoPagina } from '../../../_components/CabecalhoPagina';
import { FormularioMentoria } from '../_components/FormularioMentoria';

export const metadata: Metadata = { title: 'Nova mentoria · Administração' };

export default async function NovaMentoriaPage() {
  const supabase = await createClient();
  const { data: mentores } = await supabase
    .from('mentores')
    .select('id, nome, headline, ativo')
    .order('ativo', { ascending: false })
    .order('nome');

  return (
    <>
      <CabecalhoPagina titulo="Nova mentoria" descricao="Organize a sessão antes de publicar." />
      <FormularioMentoria mentores={mentores ?? []} />
    </>
  );
}
