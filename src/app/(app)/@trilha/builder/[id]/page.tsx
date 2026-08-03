import { obterSolucaoDoBuilder } from '@/lib/builder/queries';
import { TrilhaCabecalho } from '../../../_components/TrilhaCabecalho';

/**
 * A trilha do projeto do Builder.
 *
 * Enquanto a entrevista não terminou não existe título — o modelo só o escreve
 * junto com o documento. A ideia original é o que a pessoa reconhece, e é ela que
 * vai para o degrau atual até o projeto ficar pronto.
 */
export default async function TrilhaDoProjeto({ params }: PageProps<'/builder/[id]'>) {
  const { id } = await params;
  const solucao = await obterSolucaoDoBuilder(id);
  if (!solucao) return null;

  return (
    <TrilhaCabecalho
      voltarPara="/builder"
      voltarRotulo="Builder"
      atual={solucao.titulo || solucao.ideiaOriginal}
    />
  );
}
