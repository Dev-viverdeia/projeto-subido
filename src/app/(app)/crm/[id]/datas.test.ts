import { describe, expect, it } from 'vitest';
import { dataCompleta } from './datas';

describe('data de atualização da ficha', () => {
  it('mantém a data de Brasília quando o servidor já está no dia seguinte em UTC', () => {
    expect(dataCompleta('2026-09-06T01:45:00Z')).toBe('05 de setembro de 2026');
    expect(dataCompleta('2026-01-01T01:00:00Z')).toBe('31 de dezembro de 2025');
  });

  it('mantém o mesmo dia para instantes equivalentes com offsets diferentes', () => {
    expect(dataCompleta('2026-09-06T01:45:00Z')).toBe(dataCompleta('2026-09-05T22:45:00-03:00'));
    expect(dataCompleta('2026-09-06T03:00:00Z')).toBe('06 de setembro de 2026');
  });
});
