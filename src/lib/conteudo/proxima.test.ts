import { describe, expect, it } from 'vitest';
import { escolherProxima } from './proxima';

/**
 * O card "próxima solução" AFIRMA parentesco ("continua a trilha de Vendas"), e
 * afirmação é o que esta casa não deixa passar sem dado. Os casos abaixo são
 * justamente aqueles em que a afirmação poderia sair errada sem que nada
 * quebrasse: a última do catálogo, a única da categoria, e a solução sem
 * categoria nenhuma.
 */
const s = (slug: string, categoria: string | null) => ({
  slug,
  titulo: `Solução ${slug}`,
  categoria,
});

/* Já na ordem que a query devolve (`order by ordem`). */
const CATALOGO = [
  s('a', 'Vendas'),
  s('b', 'Suporte'),
  s('c', 'Vendas'),
  s('d', null),
  s('e', 'Marketing'),
];

describe('escolher a próxima solução', () => {
  it('prefere a próxima da MESMA categoria, mesmo saltando outras', () => {
    const p = escolherProxima(CATALOGO, 'a');
    expect(p?.slug).toBe('c');
    expect(p?.mesmaTrilha).toBe(true);
  });

  it('sem vizinha na categoria, cai para a seguinte do catálogo e NÃO afirma trilha', () => {
    const p = escolherProxima(CATALOGO, 'b');
    expect(p?.slug).toBe('c');
    expect(p?.mesmaTrilha).toBe(false);
  });

  it('a última do catálogo não tem próxima — nada de carrossel', () => {
    expect(escolherProxima(CATALOGO, 'e')).toBeNull();
  });

  it('a última da categoria segue para a próxima do catálogo, sem trilha', () => {
    const p = escolherProxima(CATALOGO, 'c');
    expect(p?.slug).toBe('d');
    expect(p?.mesmaTrilha).toBe(false);
  });

  /* Duas soluções "sem categoria" não formam trilha: null casando com null
     inventaria um parentesco que o dado não declara. */
  it('categoria nula nunca casa com categoria nula', () => {
    const semCategoria = [s('x', null), s('y', null)];
    const p = escolherProxima(semCategoria, 'x');
    expect(p?.slug).toBe('y');
    expect(p?.mesmaTrilha).toBe(false);
  });

  it('slug fora do catálogo devolve null em vez de a primeira solução', () => {
    expect(escolherProxima(CATALOGO, 'inexistente')).toBeNull();
  });

  it('catálogo de uma solução só devolve null', () => {
    expect(escolherProxima([s('unica', 'Vendas')], 'unica')).toBeNull();
  });
});
