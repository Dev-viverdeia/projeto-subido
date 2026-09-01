import { describe, expect, it } from 'vitest';
import { blocosDaResposta } from './resposta';

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
