import { obterSolucao } from '@/lib/conteudo/queries';
import { TrilhaCabecalho } from '../../../_components/TrilhaCabecalho';

/**
 * A trilha da ficha de solução.
 *
 * A CONSULTA É DE GRAÇA. `obterSolucao` é `cache()` do React, e a página de
 * conteúdo já a chamou no mesmo request — este slot recebe o resultado
 * memorizado, sem uma segunda ida ao banco. É exatamente o que torna o slot
 * paralelo melhor que passar o título por contexto: dado de servidor, sem estado
 * de cliente e sem o pisca de "seção primeiro, título depois".
 *
 * `null` quando o slug não existe: a página irmã já vai chamar `notFound()`, e
 * uma trilha apontando para um título inexistente seria a única coisa na tela
 * afirmando que a página existe.
 */
export default async function TrilhaDaSolucao({ params }: PageProps<'/solucoes/[slug]'>) {
  const { slug } = await params;
  const solucao = await obterSolucao(slug);
  if (!solucao) return null;

  return (
    <TrilhaCabecalho
      voltarPara="/solucoes"
      voltarRotulo="Soluções de IA"
      meio={solucao.categoria}
      atual={solucao.titulo}
    />
  );
}
