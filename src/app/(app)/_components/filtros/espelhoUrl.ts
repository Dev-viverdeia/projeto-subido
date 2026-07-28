'use client';

/**
 * ESCRITA dos filtros na URL. Toca `window`, então é client de verdade — e mora
 * separado de `urlFiltros.ts` (leitura, pura, importável pelo servidor) para que
 * a diretiva não contamine a função de leitura. Ver o docblock de lá.
 *
 * `history.replaceState` direto, e não `router.replace`: a rota é dinâmica, e um
 * replace do router dispararia uma re-renderização de servidor por tecla digitada.
 * O Next ≥15 assume atualizações rasas feitas pela History API nativa.
 *
 * Duas regras herdadas da plataforma de referência (bugs reais de lá):
 *  · apagar SÓ as chaves próprias — um clique pago chega com `utm_*` na URL, e
 *    limpar tudo destruiria a atribuição;
 *  · valor `null`/vazio remove a chave, para a URL limpa continuar limpa.
 */
export function atualizarUrlFiltros(valores: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [chave, valor] of Object.entries(valores)) {
    if (valor === null || valor === '') url.searchParams.delete(chave);
    else url.searchParams.set(chave, valor);
  }
  window.history.replaceState(window.history.state, '', url);
}
