import { describe, expect, it } from 'vitest';
import { chaveRascunhoAgenda, lerRascunhoAgenda } from './rascunho-agenda';
describe('rascunho da agenda', () => {
  it('restaura só os campos permitidos dentro de duas horas', () => {
    expect(
      lerRascunhoAgenda(
        JSON.stringify({
          salvoEm: 1000,
          campos: { titulo: 'Nina', liveCoach: '', token: 'não restaurar' },
        }),
        2000,
      ),
    ).toEqual({ titulo: 'Nina', liveCoach: '' });
  });
  it('descarta rascunho vencido, futuro, corrompido ou malformado', () => {
    for (const valor of [
      null,
      '{}',
      '{',
      JSON.stringify({ salvoEm: 1, campos: { titulo: 'Nina' } }),
      JSON.stringify({ salvoEm: 99_000_000, campos: {} }),
      JSON.stringify({ salvoEm: 9_000_000, campos: { titulo: 10 } }),
    ]) {
      expect(lerRascunhoAgenda(valor, 9_000_001)).toBeNull();
    }
  });
  it('isola o rascunho por usuário', () => {
    expect(chaveRascunhoAgenda('a')).not.toBe(chaveRascunhoAgenda('b'));
  });
});
