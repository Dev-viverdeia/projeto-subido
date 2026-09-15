import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  consumirRetornoProspeccao,
  guardarRetornoProspeccao,
  interpretarPosicao,
  VALIDADE_RETORNO,
} from './retorno-local';

const origem = {
  lista: '11111111-1111-4111-8111-111111111111',
  empresa: '22222222-2222-4222-8222-222222222222',
};
const posicao = { ...origem, topo: -150, largura: 390, em: 100000000 };

afterEach(() => {
  consumirRetornoProspeccao();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('posição temporária da Prospecção', () => {
  it('aceita somente medidas finitas, IDs válidos e um registro recente', () => {
    expect(interpretarPosicao(JSON.stringify(posicao), posicao.em)).toEqual(posicao);
    expect(
      interpretarPosicao(JSON.stringify(posicao), posicao.em + VALIDADE_RETORNO + 1),
    ).toBeNull();
    expect(interpretarPosicao(JSON.stringify(posicao), posicao.em - 1)).toBeNull();
    for (const invalido of [
      { topo: '10' },
      { topo: 100001 },
      { largura: 0 },
      { largura: '390' },
      { em: 'agora' },
      { empresa: '//externo' },
    ]) {
      expect(
        interpretarPosicao(JSON.stringify({ ...posicao, ...invalido }), posicao.em),
      ).toBeNull();
    }
    expect(interpretarPosicao('{')).toBeNull();
    expect(interpretarPosicao(null)).toBeNull();
  });

  it('guarda somente a posição, fixa a lista no histórico e consome uma única vez', () => {
    document.body.innerHTML = `<article><h3 id="empresa-${origem.empresa}">Nome privado não deve ser salvo</h3></article>`;
    const replace = vi.spyOn(window.history, 'replaceState');
    guardarRetornoProspeccao(origem);
    const posicaoSalva = consumirRetornoProspeccao();
    expect(posicaoSalva).toMatchObject({ ...origem, topo: 0, largura: innerWidth });
    expect(JSON.stringify(posicaoSalva)).not.toContain('Nome privado');
    expect(replace.mock.calls.at(-1)?.[2]).toContain(
      `lista=${origem.lista}&empresa=${origem.empresa}`,
    );
    expect(consumirRetornoProspeccao()).toBeNull();
  });

  it('não interrompe a navegação com storage bloqueado', () => {
    document.body.innerHTML = `<article><h3 id="empresa-${origem.empresa}">Empresa</h3></article>`;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Bloqueado');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Bloqueado');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Bloqueado');
    });
    expect(() => guardarRetornoProspeccao(origem)).not.toThrow();
    expect(consumirRetornoProspeccao()).toMatchObject(origem);
    expect(consumirRetornoProspeccao()).toBeNull();
  });

  it('não registra uma empresa ausente da tela', () => {
    guardarRetornoProspeccao(origem);
    expect(consumirRetornoProspeccao()).toBeNull();
  });
});
