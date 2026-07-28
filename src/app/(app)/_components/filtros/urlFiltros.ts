'use client';

/**
 * Espelha o estado dos filtros na URL SEM navegar.
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

/** Lê os filtros iniciais de `searchParams` (RSC) com defaults seguros. */
export type FiltrosIniciais = {
  q: string;
  categoria: string;
  ferramentas: string[];
  ordem: 'recentes' | 'alfabetica';
};

export function lerFiltrosIniciais(params: {
  [chave: string]: string | string[] | undefined;
}): FiltrosIniciais {
  const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
  const ordem = um(params.ordem);
  return {
    q: um(params.q).slice(0, 120),
    categoria: um(params.categoria).slice(0, 80),
    /* `~` como separador (vírgula vira %2C e polui a URL). */
    ferramentas: um(params.f)
      .split('~')
      .map((f) => f.trim())
      .filter(Boolean)
      .slice(0, 12),
    ordem: ordem === 'alfabetica' ? 'alfabetica' : 'recentes',
  };
}
