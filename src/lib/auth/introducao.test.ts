import { describe, expect, it } from 'vitest';
import { concluiuIntroducaoSubido } from './introducao';

describe('concluiuIntroducaoSubido', () => {
  it('libera apenas quem tem uma conclusão persistida', () => {
    expect(concluiuIntroducaoSubido(null)).toBe(false);
    expect(concluiuIntroducaoSubido({})).toBe(false);
    expect(concluiuIntroducaoSubido({ introducao_subido_concluida_em: '' })).toBe(false);
    expect(
      concluiuIntroducaoSubido({ introducao_subido_concluida_em: '2026-08-20T12:00:00Z' }),
    ).toBe(true);
  });
});
