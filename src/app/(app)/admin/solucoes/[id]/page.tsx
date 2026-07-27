import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { excluirSolucao } from '@/lib/conteudo/actions';
import { CabecalhoPagina } from '../../../_components/CabecalhoPagina';
import { FormularioConteudo } from '../../_components/FormularioConteudo';
import { BotaoExcluir } from '../../_components/BotaoExcluir';

export const metadata: Metadata = { title: 'Editar solução · Administração' };

export default async function EditarSolucaoPage({ params }: PageProps<'/admin/solucoes/[id]'>) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from('solucoes').select('*').eq('id', id).maybeSingle();
  /* `maybeSingle` e não `single`: `single` trata "nenhuma linha" como ERRO
     (PGRST116), o que aqui viraria um 500 para o que é só um id inexistente. */
  if (!data) notFound();

  return (
    <>
      <CabecalhoPagina titulo={data.titulo} descricao={`/solucoes/${data.slug}`} />
      <FormularioConteudo tipo="solucao" valores={data} />
      <BotaoExcluir
        id={data.id}
        acao={excluirSolucao}
        descricao="Excluir apaga também as etapas, ferramentas e prompts desta solução. Não há como desfazer."
      />
    </>
  );
}
