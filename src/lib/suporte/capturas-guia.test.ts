import { describe, expect, it } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { capturaDoPasso } from './capturas-guia';
import { ArtigoSchema } from './contrato';
import { GUIAS_INICIAIS } from './guias-iniciais';
import guias from './guias-visuais.json';

describe('guias visuais de produto', () => {
  it('mantém artigos válidos e atualiza a mesma base consultada pela IA', () => {
    for (const guia of guias) {
      const artigo = GUIAS_INICIAIS.find((g) => g.slug === guia.slug);
      expect(ArtigoSchema.safeParse(artigo).success).toBe(true);
      expect(artigo?.passos).toEqual(guia.passos);
      expect(guia.passos.length).toBeLessThanOrEqual(4);
    }
  });
  it('vincula somente imagens locais existentes aos passos corretos', () => {
    for (const guia of guias)
      for (const captura of guia.capturas) {
        expect(captura.arquivo).toMatch(/^[a-z-]+$/);
        const path = resolve('public/ajuda', `${captura.arquivo}.png`);
        expect(existsSync(path)).toBe(true);
        expect(statSync(path).size).toBeLessThan(200_000);
        expect(capturaDoPasso(guia.slug, guia.passos[captura.passo]!)).toEqual(captura);
      }
  });
  it('não associa uma captura antiga a texto alterado pela equipe', () => {
    expect(capturaDoPasso('conectar-google-agenda', 'Outra instrução publicada.')).toBeUndefined();
    expect(capturaDoPasso('nao-existe', 'Passo')).toBeUndefined();
  });
});
