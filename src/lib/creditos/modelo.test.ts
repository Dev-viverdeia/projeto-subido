import { describe, expect, it } from 'vitest';
import { apresentarMovimentoCredito, formatarMovimentoCredito } from './modelo';
import type { MovimentoCredito } from './queries';

function movimento(parcial: Partial<MovimentoCredito>): MovimentoCredito {
  return {
    id: 'movimento-1',
    tipo: 'busca',
    movimento: -5,
    saldo_apos: 25,
    descricao: '5 empresas encontradas',
    criado_em: '2026-08-24T12:00:00.000Z',
    lista_id: null,
    enriquecimento_id: null,
    mentoria_id: null,
    ...parcial,
  };
}

describe('apresentação dos créditos', () => {
  it('explica um uso e aponta para a lista que gerou o débito', () => {
    expect(apresentarMovimentoCredito(movimento({ lista_id: 'lista-1' }))).toMatchObject({
      titulo: 'Lista de prospecção',
      categoria: 'uso',
      rotuloCategoria: 'Uso',
      href: '/prospeccao?lista=lista-1',
    });
  });

  it('diferencia devolução de uma nova entrada', () => {
    expect(
      apresentarMovimentoCredito(movimento({ tipo: 'estorno_enriquecimento', movimento: 3 })),
    ).toMatchObject({ titulo: 'Créditos devolvidos', categoria: 'devolucao' });
  });

  it('formata entradas e débitos sem sinal ambíguo', () => {
    expect(formatarMovimentoCredito(50)).toBe('+50');
    expect(formatarMovimentoCredito(-3)).toBe('−3');
  });
});
