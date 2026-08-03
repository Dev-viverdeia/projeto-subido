import { obterFormacao } from '@/lib/conteudo/queries';
import { TrilhaCabecalho } from '../../../_components/TrilhaCabecalho';

/** Formação não tem categoria no schema — o degrau do meio simplesmente não existe. */
export default async function TrilhaDaFormacao({ params }: PageProps<'/formacoes/[slug]'>) {
  const { slug } = await params;
  const formacao = await obterFormacao(slug);
  if (!formacao) return null;

  return (
    <TrilhaCabecalho voltarPara="/formacoes" voltarRotulo="Formações" atual={formacao.titulo} />
  );
}
