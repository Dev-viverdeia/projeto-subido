import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isoParaCampoBrasilia } from '@/lib/mentorias/admin';
import { createClient } from '@/lib/supabase/server';
import { CabecalhoPagina } from '../../../_components/CabecalhoPagina';
import { FormularioMentoria } from '../_components/FormularioMentoria';

export const metadata: Metadata = { title: 'Editar mentoria · Administração' };

export default async function EditarMentoriaPage({ params }: PageProps<'/admin/mentorias/[id]'>) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: mentoria }, { data: mentores }] = await Promise.all([
    supabase
      .from('mentorias')
      .select(
        'id, titulo, descricao, mentor_id, inicio, fim, vagas, custo_creditos, sala_url, status',
      )
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('mentores')
      .select('id, nome, headline, ativo')
      .order('ativo', { ascending: false })
      .order('nome'),
  ]);

  if (!mentoria) notFound();

  return (
    <>
      <CabecalhoPagina titulo="Editar mentoria" descricao={mentoria.titulo} />
      <FormularioMentoria
        mentores={mentores ?? []}
        valores={{
          ...mentoria,
          inicio: isoParaCampoBrasilia(mentoria.inicio),
          fim: isoParaCampoBrasilia(mentoria.fim),
        }}
      />
    </>
  );
}
