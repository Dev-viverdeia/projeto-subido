'use client';

import type { FormacaoResumo } from '@/lib/conteudo/queries';
import { ResumoCatalogo, type LinhaResumo } from '../../_components/ResumoCatalogo';
import { contarConcluidas, formacaoMaisRecente, useProgresso } from '@/lib/progresso/local';

/**
 * O adaptador entre o catálogo de formações e a faixa de resumo compartilhada.
 *
 * SUBSTITUI O `RetomadaFormacao`, que só fazia a retomada. O catálogo de
 * formações abria sem responder as duas primeiras perguntas de quem chega —
 * "quanto existe" e "quanto eu já fiz" — enquanto o de soluções respondia as
 * duas na mesma faixa. Mesma pergunta, mesma resposta, mesmo desenho.
 */
export function ResumoFormacoes({ formacoes }: { formacoes: FormacaoResumo[] }) {
  const progresso = useProgresso();

  const linhas: LinhaResumo[] = formacoes.map((f) => ({
    slug: f.slug,
    titulo: f.titulo,
    feitas: contarConcluidas(progresso, f.aulaIds),
    total: f.aulas,
  }));

  return (
    <ResumoCatalogo
      linhas={linhas}
      base="/formacoes"
      unidade={{ singular: 'formação', plural: 'formações' }}
      itemUnidade={{ singular: 'aula', plural: 'aulas' }}
      slugRecente={formacaoMaisRecente(progresso)}
    />
  );
}
