import { describe, expect, it } from 'vitest';
import { diasAtePrazo, prazoEstaAtrasado, rotuloPrazoOperacional } from './prazo';

const AGORA = new Date('2026-08-30T23:30:00.000Z');

describe('prazo operacional', () => {
  it('compara datas pelo dia de São Paulo, não pela hora do prazo', () => {
    expect(diasAtePrazo('2026-08-30T12:00:00-03:00', AGORA)).toBe(0);
    expect(prazoEstaAtrasado('2026-08-30T12:00:00-03:00', AGORA)).toBe(false);
  });

  it('humaniza hoje, amanhã e atraso', () => {
    expect(rotuloPrazoOperacional('2026-08-30T12:00:00-03:00', AGORA)).toBe('Prazo hoje');
    expect(rotuloPrazoOperacional('2026-08-31T12:00:00-03:00', AGORA)).toBe('Prazo amanhã');
    expect(rotuloPrazoOperacional('2026-08-28T12:00:00-03:00', AGORA)).toBe('Atrasada há 2 dias');
  });
});
