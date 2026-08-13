import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterProposta } from '@/lib/propostas/queries';
import { obterExecucaoDaProposta } from '@/lib/projetos-execucao/queries';
import { EditorProposta } from '../_components/EditorProposta';

export async function generateMetadata({
  params,
}: PageProps<'/propostas/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const proposta = await obterProposta(id);
  return { title: proposta?.titulo ?? 'Proposta comercial' };
}

export default async function PropostaPage({ params }: PageProps<'/propostas/[id]'>) {
  const { id } = await params;
  const [proposta, execucaoId] = await Promise.all([
    obterProposta(id),
    obterExecucaoDaProposta(id),
  ]);
  if (!proposta) notFound();

  return (
    <EditorProposta
      id={proposta.id}
      tituloInicial={proposta.titulo}
      documentoInicial={proposta.documento}
      statusInicial={proposta.status}
      versaoInicial={proposta.versao}
      oportunidadeId={proposta.oportunidadeId}
      reuniaoId={proposta.reuniaoId}
      execucaoId={execucaoId}
    />
  );
}
