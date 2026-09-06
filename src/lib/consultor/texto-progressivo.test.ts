import { describe, expect, it } from 'vitest';
import { textoProgressivo } from './texto-progressivo';

describe('texto progressivo do Sobral', () => {
  it.each([
    'Olá, clínica.\n\nAgende a conversa.',
    'Use "Nina" e a pasta C:\\projetos.',
    'Ação 💡 pronta.',
    '<script>alert(1)</script>',
  ])('preserva todos os cortes de %s', (texto) => {
    const json = JSON.stringify({
      resposta: texto,
      diagnostico: 'INTERNO',
      recomendacoes: [{ titulo: 'NÃO VALIDADO' }],
    });
    let anterior = '';
    for (let i = 0; i <= json.length; i++) {
      const parcial = textoProgressivo(json.slice(0, i));
      expect(texto.startsWith(parcial)).toBe(true);
      expect(parcial.startsWith(anterior)).toBe(true);
      anterior = parcial;
    }
    expect(anterior).toBe(texto);
  });
  it('espera os pares Unicode escapados e não vaza os outros campos', () => {
    expect(textoProgressivo('{"resposta":"A\\u00e')).toBe('A');
    expect(textoProgressivo('{"resposta":"A\\u00e7\\u00e3o \\ud83d')).toBe('Ação ');
    expect(textoProgressivo('{"resposta":"A\\u00e7\\u00e3o \\ud83d\\udca1"}')).toBe('Ação 💡');
    expect(textoProgressivo('{"interno":{"resposta":"SEGREDO"}}')).toBe('');
    expect(textoProgressivo('{"resposta":"Texto", "outro":"privado"}')).toBe('Texto');
  });
  it('limita tamanho e rejeita escapes inválidos', () => {
    expect(textoProgressivo(JSON.stringify({ resposta: 'a'.repeat(9000) }))).toHaveLength(3000);
    expect(textoProgressivo('{"resposta":"\\x41')).toBe('');
  });
});
