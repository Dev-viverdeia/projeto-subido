import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { excluirFormacao } from '@/lib/conteudo/actions';
import { CabecalhoPagina } from '../../../_components/CabecalhoPagina';
import { FormularioConteudo } from '../../_components/FormularioConteudo';
import { BotaoExcluir } from '../../_components/BotaoExcluir';

export const metadata: Metadata = { title: 'Editar formação · Administração' };

export default async function EditarFormacaoPage({ params }: PageProps<'/admin/formacoes/[id]'>) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from('formacoes').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();

  return (
    <>
      <CabecalhoPagina titulo={data.titulo} descricao={`/formacoes/${data.slug}`} />
      <FormularioConteudo tipo="formacao" valores={data} />
      <BotaoExcluir
        id={data.id}
        acao={excluirFormacao}
        descricao="Excluir apaga também os módulos e as aulas desta formação. Não há como desfazer."
      />
    </>
  );
}
