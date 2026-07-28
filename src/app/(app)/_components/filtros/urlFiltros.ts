/**
 * Leitura dos filtros a partir da URL. **MÓDULO NEUTRO — sem `'use client'`.**
 *
 * POR QUE ISTO IMPORTA (custou duas telas quebradas em runtime)
 * Este arquivo já teve `'use client'` no topo, junto do `atualizarUrlFiltros`.
 * A diretiva marca o MÓDULO INTEIRO como client, e as páginas RSC de /solucoes e
 * /formacoes chamam `lerFiltrosIniciais(params)` durante o render do servidor:
 * o Next lança "Attempted to call lerFiltrosIniciais() from the server but it's
 * on the client" e a rota inteira cai no error boundary.
 *
 * Nem `tsc` nem `eslint` veem a fronteira client/server, e o `npm run build`
 * passou VERDE porque as duas rotas são dinâmicas (ƒ) — não são pré-renderizadas,
 * então a chamada nunca aconteceu durante o build. Só quebra quando alguém abre a
 * página. É por isso que a escrita na URL (que toca `window`) mora noutro arquivo:
 * a fronteira agora é a NATUREZA do código, não a memória de quem edita.
 */

export type FiltrosIniciais = {
  q: string;
  categoria: string;
  ferramentas: string[];
  ordem: 'recentes' | 'alfabetica';
};

/** Lê os filtros iniciais de `searchParams` (RSC) com defaults seguros. */
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
