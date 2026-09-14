import { describe, expect, it } from 'vitest';
import { separarLinksMensagem } from './links-mensagem';

describe('links no texto de uma reunião', () => {
  it('mantém texto, quebras e URLs com query e fragmento sem perdas', () => {
    const texto =
      'Segue a proposta:\nhttps://subido.viverdeia.ai/p/exemplo?token=abc%2B123&versao=2#escopo\nPodemos revisar juntos.';
    const partes = separarLinksMensagem(texto);
    expect(partes.map((p) => p.texto).join('')).toBe(texto);
    expect(partes.filter((p) => p.href)).toEqual([
      {
        texto: 'https://subido.viverdeia.ai/p/exemplo?token=abc%2B123&versao=2#escopo',
        href: 'https://subido.viverdeia.ai/p/exemplo?token=abc%2B123&versao=2#escopo',
      },
    ]);
  });

  it.each([
    ['Veja (https://exemplo.test/proposta).', 'https://exemplo.test/proposta'],
    ['“https://exemplo.test/material”, combinado?', 'https://exemplo.test/material'],
    ['[https://exemplo.test/plano_(final)]', 'https://exemplo.test/plano_(final)'],
    ['https://exemplo.test/guia?busca=(teste).', 'https://exemplo.test/guia?busca=(teste)'],
    ['HTTP://exemplo.test/guia', 'http://exemplo.test/guia'],
  ])('separa pontuação e mantém parênteses da URL: %s', (texto, href) => {
    const partes = separarLinksMensagem(texto);
    expect(partes.map((p) => p.texto).join('')).toBe(texto);
    expect(partes.filter((p) => p.href).map((p) => p.href)).toEqual([href]);
  });

  it.each([
    'javascript:alert(1)',
    'javascript:https://exemplo.test',
    'data:text/html,https://exemplo.test',
    'file:///tmp/material.pdf',
    'mailto:cliente@exemplo.test',
    'www.exemplo.test',
    '/proposta/123',
    'https://',
    'https://?',
    'https:///exemplo.test',
    'https://@exemplo.test',
    'https://cliente:senha@exemplo.test',
    'https://subido.viverdeia.ai@exemplo.test',
    'https://exemplo.test\\@outro.test',
    'https://exemplo.test/\u202egpj.exe',
    'https://exemplo.test/\u200boculto',
    'https://exemplo.test/\u0000oculto',
  ])('não cria link para entrada ambígua ou não permitida: %s', (texto) => {
    const partes = separarLinksMensagem(texto);
    expect(partes.map((p) => p.texto).join('')).toBe(texto);
    expect(partes.some((p) => p.href)).toBe(false);
  });

  it('preserva mensagens vazias, HTML literal, link inválido e link válido no mesmo texto', () => {
    expect(separarLinksMensagem('')).toEqual([]);
    const texto = '<img src=x onerror=alert(1)> https://\nhttps://exemplo.test/material';
    const partes = separarLinksMensagem(texto);
    expect(partes.map((p) => p.texto).join('')).toBe(texto);
    expect(partes.filter((p) => p.href)).toHaveLength(1);
  });

  it('mantém múltiplos links e endereços extensos sem truncar tokens', () => {
    const url = `https://exemplo.test/material?token=${'a'.repeat(1800)}`;
    const texto = `Primeiro https://exemplo.test/proposta e depois ${url}`;
    const partes = separarLinksMensagem(texto);
    expect(partes.map((p) => p.texto).join('')).toBe(texto);
    expect(partes.filter((p) => p.href).map((p) => p.href)).toEqual([
      'https://exemplo.test/proposta',
      url,
    ]);
  });
});
