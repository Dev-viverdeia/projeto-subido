import { expect, it } from 'vitest';
import { caminhoArquivoDoProjeto } from './caminho-arquivo';

it('mantém nomes produzidos pelo upload sem normalizar a chave', () => {
  expect(caminhoArquivoDoProjeto('dono/projeto/id-relatorio.v2.pdf', 'dono', 'projeto')).toBe(true);
});
it.each([
  '../alheio/a.pdf',
  '%2e%2e/a.pdf',
  '%252e%252e',
  '%2f',
  '..',
  '.',
  'a\\b',
  '/a.pdf',
  'a?x=y',
  'a#b',
  'a\n',
])('recusa chave ambígua %s', (nome) => {
  expect(caminhoArquivoDoProjeto(`dono/projeto/${nome}`, 'dono', 'projeto')).toBe(false);
});
it('recusa dono e projeto alheios mesmo com nome válido', () => {
  expect(caminhoArquivoDoProjeto('alheio/projeto/a.pdf', 'dono', 'projeto')).toBe(false);
  expect(caminhoArquivoDoProjeto('dono/outro/a.pdf', 'dono', 'projeto')).toBe(false);
});
