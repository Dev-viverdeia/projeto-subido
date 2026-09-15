import { describe, expect, it } from 'vitest';
import { hrefFichaProspeccao, hrefListaProspeccao, origemProspeccao } from './retorno';

const lista = '11111111-1111-4111-8111-111111111111';
const empresa = '22222222-2222-4222-8222-222222222222';
const venda = '33333333-3333-4333-8333-333333333333';

describe('destinos de Prospecção', () => {
  it('leva os IDs da lista e da empresa à ficha e constrói somente um retorno interno', () => {
    const origem = origemProspeccao(lista, empresa)!;
    expect(hrefFichaProspeccao(venda, origem)).toBe(
      `/vendas/${venda}?origem=prospeccao&lista=${lista}&empresa=${empresa}`,
    );
    expect(hrefFichaProspeccao(venda, origem, true)).toBe(
      `/vendas/${venda}?novo=1&origem=prospeccao&lista=${lista}&empresa=${empresa}`,
    );
    expect(hrefListaProspeccao(origem)).toBe(
      `/prospeccao?lista=${lista}&empresa=${empresa}#empresa-${empresa}`,
    );
  });

  it.each([
    '//externo.com',
    'javascript:alert(1)',
    '../vendas',
    '',
    `${lista}&lista=outra`,
    [lista],
    undefined,
  ])('não aceita origem inválida: %s', (invalido) => {
    expect(origemProspeccao(invalido, empresa)).toBeNull();
    expect(origemProspeccao(lista, invalido)).toBeNull();
  });

  it('preserva a navegação antiga quando não há lista', () => {
    expect(hrefFichaProspeccao(venda, null)).toBe(`/vendas/${venda}`);
    expect(hrefFichaProspeccao(venda, null, true)).toBe(
      `/vendas/${venda}?novo=1&origem=prospeccao`,
    );
  });
});
