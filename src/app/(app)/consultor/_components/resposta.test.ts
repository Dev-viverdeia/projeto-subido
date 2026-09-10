import { describe, expect, it } from 'vitest';
import { blocosDaResposta, leituraDaResposta } from './resposta';

describe('blocosDaResposta', () => {
  it('separa parágrafos e remove espaços sem interpretar markdown', () => {
    expect(blocosDaResposta('  Resposta direta.\n\n  Próximo passo concreto.  ')).toEqual([
      'Resposta direta.',
      'Próximo passo concreto.',
    ]);
  });

  it('preserva uma resposta em um único bloco', () => {
    expect(blocosDaResposta('Uma resposta curta.')).toEqual(['Uma resposta curta.']);
  });
});

describe('leituraDaResposta', () => {
  it('mantém respostas curtas abertas', () => {
    expect(leituraDaResposta('Resposta.\n\nDetalhe.')).toEqual({
      abertura: ['Resposta.', 'Detalhe.'],
      restante: [],
    });
  });
  it('dobra entre parágrafos sem remover nem reordenar palavras', () => {
    const blocos = ['a'.repeat(300), 'b'.repeat(300), 'c'.repeat(650)];
    const leitura = leituraDaResposta(blocos.join('\n\n'));
    expect(leitura.abertura).toEqual(blocos.slice(0, 1));
    expect([...leitura.abertura, ...leitura.restante]).toEqual(blocos);
  });
  it('mostra só o primeiro parágrafo se os dois ultrapassam a medida', () => {
    const leitura = leituraDaResposta(
      ['a'.repeat(600), 'b'.repeat(400), 'c'.repeat(300)].join('\n\n'),
    );
    expect(leitura.abertura).toHaveLength(1);
    expect(leitura.restante).toHaveLength(2);
  });
  it('não corta um parágrafo longo ou uma resposta com só dois blocos', () => {
    for (const blocos of [
      ['x'.repeat(1500)],
      ['x'.repeat(800), 'b', 'c'.repeat(400)],
      ['a'.repeat(650), 'b'.repeat(650)],
    ]) {
      expect(leituraDaResposta(blocos.join('\n\n'))).toEqual({ abertura: blocos, restante: [] });
    }
  });
  it('preserva marcações e HTML como texto literal', () => {
    const texto = '<script>alert(1)</script>\n\n**Não execute**\n- Texto literal';
    expect(leituraDaResposta(texto).abertura.join('\n\n')).toBe(texto);
  });
});
