import { describe, expect, it } from 'vitest';
import { projetoSugeridoDaProspeccao } from './projeto-sugerido';

describe('projetoSugeridoDaProspeccao', () => {
  it('recupera um projeto válido preservado pela Prospecção', () => {
    expect(
      projetoSugeridoDaProspeccao({
        qualificacao: {
          oportunidade: { projeto_slug: 'sdr-atendimento-qualificacao' },
        },
      }),
    ).toBe('sdr-atendimento-qualificacao');
  });

  it('ignora valores desconhecidos em dados externos', () => {
    expect(
      projetoSugeridoDaProspeccao({
        qualificacao: { oportunidade: { projeto_slug: 'projeto-inventado' } },
      }),
    ).toBeNull();
    expect(projetoSugeridoDaProspeccao(null)).toBeNull();
  });
});
