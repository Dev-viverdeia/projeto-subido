import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { retornoGoogleCalendarSeguro } from './estado-oauth';

describe('retornoGoogleCalendarSeguro', () => {
  it('aceita somente rotas internas conhecidas da plataforma', () => {
    expect(retornoGoogleCalendarSeguro('/calls?nova=1')).toBe('/calls?nova=1');
    expect(retornoGoogleCalendarSeguro('/conta')).toBe('/conta');
  });

  it('bloqueia redirecionamentos externos e rotas fora do app', () => {
    expect(retornoGoogleCalendarSeguro('https://exemplo.com')).toBe('/conta');
    expect(retornoGoogleCalendarSeguro('//exemplo.com')).toBe('/conta');
    expect(retornoGoogleCalendarSeguro('/api/segredo')).toBe('/conta');
  });
});
