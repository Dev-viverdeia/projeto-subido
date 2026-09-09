import { describe, expect, it } from 'vitest';
import { CONTEXTOS_FALHA, contextoFalha, linkAjudaNaFalha } from './recuperacao';
import { GUIAS_INICIAIS } from './guias-iniciais';

describe('ajuda contextual segura', () => {
  it('usa somente guias existentes', () => {
    for (const c of Object.values(CONTEXTOS_FALHA))
      expect(GUIAS_INICIAIS.some((g) => g.slug === c.guia)).toBe(true);
  });
  it.each([null, '', '__proto__', 'constructor', 'token=secreto', ['agenda']])(
    'ignora contexto desconhecido %j',
    (valor) => {
      expect(contextoFalha(valor)).toBeNull();
    },
  );
  it('compartilha só a rota sem consulta ou fragmento', () => {
    const link = linkAjudaNaFalha('entrega', '/entregas/abc?email=privado#token');
    const params = new URL(link, 'https://example.test').searchParams;
    expect(params.get('origem')).toBe('/entregas/abc');
    expect(params.get('contexto')).toBe('entrega');
    expect(link).not.toMatch(/email|privado|token/);
  });
  it.each(['https://fora.test', '//fora.test', '/api/segredo', '/conta/../admin'])(
    'não transfere rota indevida %s',
    (pagina) => {
      expect(
        new URL(linkAjudaNaFalha('agenda', pagina), 'https://example.test').searchParams.get(
          'origem',
        ),
      ).toBe('/conta');
    },
  );
});
