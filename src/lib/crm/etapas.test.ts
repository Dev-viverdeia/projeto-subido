import { describe, expect, it } from 'vitest';
import { ETAPAS_MOVIMENTO_CRM, FASES_CRM, etapaVisivel, faseDaEtapa } from './etapas';

describe('etapas do CRM', () => {
  it('resume as sete etapas persistidas em quatro fases visíveis', () => {
    expect(FASES_CRM.map((fase) => fase.id)).toEqual([
      'entrada',
      'conversa',
      'proposta',
      'fechados',
    ]);
    expect(faseDaEtapa('qualificacao')).toBe('entrada');
    expect(faseDaEtapa('negociacao')).toBe('proposta');
    expect(faseDaEtapa('ganho')).toBe('fechados');
  });

  it('oferece apenas decisões comerciais úteis ao mover um card', () => {
    expect(ETAPAS_MOVIMENTO_CRM.map((etapa) => etapa.id)).toEqual([
      'novo_lead',
      'descoberta',
      'proposta',
      'ganho',
      'perdido',
    ]);
    expect(etapaVisivel('qualificacao')).toBe('novo_lead');
    expect(etapaVisivel('negociacao')).toBe('proposta');
  });
});
