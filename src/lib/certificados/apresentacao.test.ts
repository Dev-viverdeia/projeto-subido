import { describe, expect, it } from 'vitest';
import { apresentacaoCertificado } from './apresentacao';

describe('identificação de demonstração', () => {
  it('separa o nome do marcador sem perder o aviso', () => {
    expect(apresentacaoCertificado('Rafael Milagre — CERTIFICADO DE DEMONSTRAÇÃO')).toEqual({
      nome: 'Rafael Milagre',
      demonstracao: true,
    });
  });
  it('preserva nomes reais, inclusive com hífen', () => {
    expect(apresentacaoCertificado('Ana-Maria Souza')).toEqual({
      nome: 'Ana-Maria Souza',
      demonstracao: false,
    });
  });
});
