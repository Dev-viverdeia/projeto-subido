'use client';

import type { SolucaoResumo } from '@/lib/conteudo/queries';
import { ResumoCatalogo, type LinhaResumo } from '../../_components/ResumoCatalogo';
import { contarEtapasFeitas, solucaoMaisRecente, useProgresso } from '@/lib/progresso/local';

/**
 * O adaptador entre o catálogo de soluções e a faixa de resumo compartilhada.
 *
 * A FAIXA NÃO SABE O QUE ESTÁ CONTANDO, e é isso que a deixa servir os dois
 * pilares: ela recebe `{slug, titulo, feitas, total}` e não pergunta se aquilo é
 * etapa ou aula. Quem lê o progresso da conta — conhecimento deste pilar — é
 * este arquivo de vinte linhas.
 */
export function ResumoSolucoes({ solucoes }: { solucoes: SolucaoResumo[] }) {
  const progresso = useProgresso();

  const linhas: LinhaResumo[] = solucoes.map((s) => ({
    slug: s.slug,
    titulo: s.titulo,
    feitas: contarEtapasFeitas(progresso, s.etapaIds),
    total: s.etapaIds.length,
  }));

  return (
    <ResumoCatalogo
      linhas={linhas}
      base="/solucoes"
      unidade={{ singular: 'projeto', plural: 'projetos' }}
      itemUnidade={{ singular: 'passo', plural: 'passos' }}
      slugRecente={solucaoMaisRecente(progresso)}
    />
  );
}
