import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterProposta } from '@/lib/propostas/queries';
import { obterExecucaoDaProposta } from '@/lib/projetos-execucao/queries';
import { env } from '@/lib/env';
import { obterPerfilComercial } from '@/lib/perfil-comercial/queries';
import { completarDocumentoComPerfil } from '@/lib/propostas/perfil';
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
  const [proposta, execucaoId, perfilComercial] = await Promise.all([
    obterProposta(id),
    obterExecucaoDaProposta(id),
    obterPerfilComercial(),
  ]);
  if (!proposta) notFound();
  const documentoCompleto = completarDocumentoComPerfil(proposta.documento, perfilComercial);
  const identidadePendente =
    JSON.stringify(documentoCompleto) !== JSON.stringify(proposta.documento);

  return (
    <EditorProposta
      id={proposta.id}
      tituloInicial={proposta.titulo}
      documentoInicial={documentoCompleto}
      alteracaoInicial={identidadePendente}
      statusInicial={proposta.status}
      versaoInicial={proposta.versao}
      oportunidadeId={proposta.oportunidadeId}
      reuniaoId={proposta.reuniaoId}
      execucaoId={execucaoId}
      compartilhamentoInicial={proposta.compartilhamento}
      siteUrl={env.NEXT_PUBLIC_SITE_URL}
    />
  );
}
