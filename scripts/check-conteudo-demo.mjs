#!/usr/bin/env node
/**
 * Gate: a landing não vai para produção com conteúdo inventado.
 *
 * `src/content/landing/index.ts` teve seus placeholders (`[N]`, `R$ [X]`,
 * `[Nome do aluno]`) preenchidos com valores de demonstração para a página poder ser
 * apresentada cheia. Depoimento fabricado numa página de conversão é exposição de
 * CDC/CONAR e preço fabricado é oferta — os dois precisam de uma porta de saída, e
 * esta é ela.
 *
 * ESTE SCRIPT NÃO ESTÁ NO CI, E ISSO É DELIBERADO — mas foi um erro de descrição
 * antes: a versão anterior deste comentário citava o CLAUDE.md ("se não é aplicado no
 * CI, é sugestão") como se ele já estivesse no validate-pr.yml. Não está, e nunca
 * esteve. Enquanto a plataforma for MVP com conteúdo mockado, pô-lo no CI deixaria
 * toda PR vermelha por uma condição conhecida e aceita — alarme que toca sempre é
 * alarme que ninguém escuta.
 *
 * O ponto de ligação certo é o DEPLOY DE PRODUÇÃO, não o merge: mock no repositório é
 * normal, mock no ar é oferta falsa. Quem montar o pipeline de produção: chame
 * `npm run check:conteudo-demo` lá, e aí ele vira o gate que o nome promete.
 *
 * Até então, rode antes de qualquer publicação. O conteúdo de demonstração é
 * exatamente o tipo de coisa que passa com tsc, eslint, prettier e build verdes.
 *
 * Como desligar: troque o conteúdo por real e ponha `CONTEUDO_DEMO = false`. Desligar
 * a flag sem trocar o conteúdo publica os mesmos dados inventados, agora sem aviso.
 */
import { readFileSync } from 'node:fs';

const ARQUIVO = 'src/content/landing/index.ts';

let fonte;
try {
  fonte = readFileSync(ARQUIVO, 'utf8');
} catch {
  console.error(`✗ não achei ${ARQUIVO} — o gate não consegue se pronunciar.`);
  process.exit(1);
}

const declaracao = fonte.match(/export const CONTEUDO_DEMO\s*=\s*(true|false)\s*;/);

if (!declaracao) {
  console.error(
    `✗ ${ARQUIVO} não declara CONTEUDO_DEMO.\n` +
      '  A flag é o que separa "página de demonstração" de "página no ar".\n' +
      '  Se o conteúdo já é real, declare `export const CONTEUDO_DEMO = false;`.',
  );
  process.exit(1);
}

if (declaracao[1] === 'true') {
  console.error(
    '✗ a landing está com CONTEÚDO DE DEMONSTRAÇÃO ligado.\n' +
      '\n' +
      '  São INVENTADOS: os três depoimentos (nome, cidade, prazo e resultado), os\n' +
      '  preços dos planos, os números da plataforma, a data do HUB, quatro respostas\n' +
      '  de FAQ e os contatos do rodapé.\n' +
      '\n' +
      '  Depoimento fabricado em página de conversão é exposição de CDC/CONAR, e preço\n' +
      '  fabricado é oferta. Nenhum dos dois pode ir ao ar por esquecimento.\n' +
      '\n' +
      `  Para liberar: substitua o conteúdo em ${ARQUIVO} e então\n` +
      '  `export const CONTEUDO_DEMO = false;`.\n' +
      '\n' +
      '  Desligar a flag SEM trocar o conteúdo é o pior dos dois mundos: publica os\n' +
      '  mesmos dados inventados e apaga o aviso na tela.',
  );
  process.exit(1);
}

console.log('✓ landing sem conteúdo de demonstração');
