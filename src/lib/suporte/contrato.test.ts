import { describe, expect, it } from 'vitest';
import {
  ArtigoSchema,
  CriarSchema,
  paginaSegura,
  paginaHistorico,
  buscarArtigos,
  tipoRealArquivo,
} from './contrato';
import { GUIAS_INICIAIS } from './guias-iniciais';

describe('contrato da central de suporte', () => {
  it('mantém os guias iniciais válidos e com slugs únicos', () => {
    expect(GUIAS_INICIAIS.length).toBeGreaterThanOrEqual(12);
    expect(new Set(GUIAS_INICIAIS.map((a) => a.slug)).size).toBe(GUIAS_INICIAIS.length);
    for (const guia of GUIAS_INICIAIS) expect(ArtigoSchema.safeParse(guia).success).toBe(true);
  });
  it('encontra proposta sem reunião sem depender de acentos', () => {
    expect(buscarArtigos(GUIAS_INICIAIS, 'proposta sem reuniao')[0]?.slug).toBe(
      'criar-proposta-sem-reuniao',
    );
    expect(buscarArtigos(GUIAS_INICIAIS, 'conectar agenda')[0]?.slug).toBe(
      'conectar-google-agenda',
    );
    expect(buscarArtigos(GUIAS_INICIAIS, 'astronauta')).toEqual([]);
  });
  it('não compartilha tokens, consultas ou destinos externos', () => {
    expect(paginaSegura('/vendas/123?token=secreto#dados')).toBe('/vendas/123');
    for (const destino of [
      'https://evil.test',
      '//evil.test',
      '/admin',
      '/api/secret',
      '/vendas/../admin',
      '/vendas\\admin',
    ])
      expect(paginaSegura(destino)).toBeNull();
    expect(
      ArtigoSchema.safeParse({ ...GUIAS_INICIAIS[0], destino: 'https://evil.test' }).success,
    ).toBe(false);
  });
  it('valida pedido, limite de anexos e contexto', () => {
    const pedido = {
      id: crypto.randomUUID(),
      assunto: 'Minha agenda',
      categoria: 'reunioes',
      texto: 'Não consigo conectar a agenda.',
      pagina: null,
      anexos: [],
    };
    expect(CriarSchema.safeParse(pedido).success).toBe(true);
    expect(
      CriarSchema.safeParse({
        ...pedido,
        anexos: Array.from({ length: 4 }, () => crypto.randomUUID()),
      }).success,
    ).toBe(false);
    expect(CriarSchema.safeParse({ ...pedido, texto: 'x'.repeat(6001) }).success).toBe(false);
  });
  it('não confunde HTML/SVG com imagens e PDF', () => {
    expect(tipoRealArquivo(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]))).toBe('image/png');
    expect(tipoRealArquivo(new TextEncoder().encode('%PDF-1.7'))).toBe('application/pdf');
    expect(tipoRealArquivo(new TextEncoder().encode('<svg onload="alert(1)">'))).toBeNull();
    expect(tipoRealArquivo(new Uint8Array())).toBeNull();
  });
  it('limita parâmetros de paginação inválidos', () => {
    expect(paginaHistorico('2')).toBe(2);
    for (const p of ['-1', 'NaN', 'Infinity', '1e7', ['1'], undefined])
      expect(paginaHistorico(p)).toBe(0);
  });
});
