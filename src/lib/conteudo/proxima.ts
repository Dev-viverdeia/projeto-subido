import type { Tables } from '@/lib/supabase/types.generated';

/**
 * A escolha da PRÓXIMA solução — pura, e num arquivo separado de propósito.
 *
 * `queries.ts` abre com `import 'server-only'`, que EXPLODE ao ser importado num
 * ambiente de cliente — e o teste roda em jsdom. Deixar a regra aqui é o que
 * permite prender os casos de borda em teste sem afrouxar a barreira do módulo de
 * leitura.
 */
export type VizinhaSolucao = Pick<Tables<'solucoes'>, 'slug' | 'titulo' | 'categoria'> & {
  /** `true` quando a próxima pertence à MESMA categoria da atual. */
  mesmaTrilha: boolean;
};

/**
 * A ORDEM É A DA TRILHA, e ela já existe: `solucoes.ordem` é o campo que o admin
 * usa para sequenciar o catálogo. Aqui ele ganha um segundo uso — "o que vem
 * depois" — sem inventar tabela de trilha nenhuma.
 *
 * PREFERE A MESMA CATEGORIA, e o card só afirma "continua a trilha de Vendas"
 * quando isso é verdade. Sem uma vizinha na categoria, cai para a próxima do
 * catálogo e o card muda de frase em vez de mentir sobre parentesco.
 *
 * VOLTA AO COMEÇO? NÃO. Na última solução não há próxima e o card some. Um
 * "próxima" que aponta para a primeira transforma um catálogo finito em
 * carrossel: quem chega ao fim nunca descobre que chegou.
 *
 * A lista precisa vir ORDENADA por `ordem` — é o chamador que garante isso, com
 * o `.order()` da query.
 */
export function escolherProxima(
  lista: Pick<Tables<'solucoes'>, 'slug' | 'titulo' | 'categoria'>[],
  atual: string,
): VizinhaSolucao | null {
  const indice = lista.findIndex((s) => s.slug === atual);
  if (indice === -1) return null;

  const categoriaAtual = lista[indice]?.categoria ?? null;
  const seguintes = lista.slice(indice + 1);

  /* Categoria nula NÃO casa com categoria nula: duas soluções sem categoria não
     formam trilha, e afirmar que formam seria inventar parentesco. */
  const naTrilha = categoriaAtual
    ? seguintes.find((s) => s.categoria === categoriaAtual)
    : undefined;

  const escolhida = naTrilha ?? seguintes[0];
  if (!escolhida) return null;

  return {
    slug: escolhida.slug,
    titulo: escolhida.titulo,
    categoria: escolhida.categoria,
    mesmaTrilha: Boolean(naTrilha),
  };
}
