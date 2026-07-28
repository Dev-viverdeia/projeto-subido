#!/usr/bin/env node
/**
 * GATE DA IDENTIDADE — o que impede a camada de marca de virar sugestão.
 *
 * O design system já traz as escalas; o problema medido era a NOSSA camada não
 * as obedecer. Antes deste gate, os módulos do app usavam 9 durações inventadas
 * (240/260/140/480/320/460/280/200/80ms) e 5 valores de letter-spacing soltos,
 * enquanto o DS oferecia 4 e 6 respectivamente. Valor que varia sem motivo é
 * exatamente o que lê como "não preparado" — e nenhum lint pegava.
 *
 * O CLAUDE.md afirmava que hex literal era erro de lint. Não era: a regra existia
 * só no texto. Este arquivo é a regra virando gate.
 *
 * ESCOPO — só a camada que nós escrevemos:
 *   · `src/design-system/via/**` fica de fora: é vendorizado, e quem o policia é
 *     o check:ds-drift.
 *   · `src/styles/brand.css` e `src/styles/type.css` ficam de fora: são onde a
 *     paleta e a tipografia são DEFINIDAS. Um gate que proíbe hex no arquivo que
 *     declara as cores se contradiz. Policia-se o CONSUMO.
 *
 * ESCAPE HATCH — um comentário CSS contendo `token-ok: <motivo>`, em qualquer
 * lugar da REGRA em que o desvio está.
 *
 * Existe porque a regra da casa não é "nunca desvie", é "desvio sem motivo
 * escrito vira mistério em três meses". A exceção fica no diff, com o porquê.
 */

import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { relative } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname;

const ALVOS = ['src/**/*.module.css', 'src/app/**/*.css', 'src/styles/*.css'];

/* A camada de DEFINIÇÃO fica fora: um gate que proíbe hex no arquivo que declara
   as cores, ou tracking no arquivo que declara a tipografia, se contradiz. O que
   se policia é o CONSUMO. */
const IGNORADOS = [
  'src/design-system/**', // vendorizado · policiado por check:ds-drift
  'src/styles/brand.css', // declara a paleta e a identidade
  'src/styles/type.css', // declara as classes tipográficas da landing
];

/** Uma regra = como achar, como explicar, o que usar no lugar. */
const REGRAS = [
  {
    id: 'duracao-solta',
    /* SÓ `transition`, nunca `animation`. Há três categorias de movimento e
       apenas uma deve ser sistemática:

         · INTERAÇÃO (`transition`) — é a resposta ao dedo, o vocabulário que a
           pessoa aprende usando o produto. Precisa ser o mesmo em toda parte,
           senão a interface lê como peças de origens diferentes. É o que este
           gate cobre, e era onde estava o estrago: 240/260/140/200/280ms
           espalhados por hovers que fazem exatamente a mesma coisa.
         · AMBIENTE (`animation … infinite`) — o pulso de "ao vivo", a dica de
           scroll. São laços autorais, e um batimento e uma dica legitimamente
           não duram o mesmo.
         · COREOGRAFIA (`animation` de entrada) — a cascata da landing. É
           composição, e o CLAUDE.md já a governa pela regra oposta: cada ato
           recebe uma micro-interação DIFERENTE, ou nenhuma.

       Um gate que forçasse os três à mesma escala destruiria as duas últimas
       para consertar a primeira. */
    linhaAlvo: /transition(-duration|-delay)?\s*:/,
    achar: /(?<!var\([^)]*)\b\d+(?:\.\d+)?m?s\b/g,
    excecoes: [/^0\.0?0?1ms$/, /^0m?s$/], // reduced-motion e `0s` de reset
    porque: 'duração de interação solta — é o vocabulário de resposta, tem que ser um só',
    use: '--app-t-state · -touch · -reveal · -scene (ou --app-motion-* cru)',
  },
  {
    id: 'tracking-solto',
    achar: /letter-spacing:\s*(-?\d*\.?\d+)(em|px|rem)/g,
    porque: 'tracking solto — o tracking é função do TAMANHO, não escolha por componente',
    use: '--app-ls-* (hero…micro) ou --app-ls-eyebrow para mono caixa-alta',
  },
  {
    id: 'hex-literal',
    achar: /#[0-9a-fA-F]{3,8}\b/g,
    porque: 'cor literal — a marca deixa de conseguir mudar de cor num lugar só',
    use: 'um token --via-* / --cst-*; se a cor não existe, ela nasce em brand.css',
  },
];

/* O ESCAPE COBRE A REGRA INTEIRA em que aparece — não a linha.
   `transition` e `transition-delay` de uma cascata são a MESMA decisão; um
   escape por linha obrigaria a repetir o motivo em cada declaração, e motivo
   repetido é motivo que ninguém lê. Sobe até a abertura do bloco `{` e varre
   também o comentário imediatamente acima dela, que é onde o motivo costuma
   morar depois de o prettier reposicionar. */
function temEscape(linhas, i) {
  let abertura = i;
  while (abertura > 0 && !linhas[abertura].includes('{')) abertura -= 1;

  let topo = abertura;
  while (topo > 0 && /^\s*(\/\*|\*|$)/.test(linhas[topo - 1] ?? '')) topo -= 1;

  return linhas.slice(topo, i + 1).some((l) => /token-ok:/.test(l));
}

const arquivos = globSync(ALVOS, { cwd: RAIZ, exclude: IGNORADOS });

const achados = [];
for (const rel of arquivos) {
  const linhas = readFileSync(new URL(rel, new URL('..', import.meta.url)), 'utf8').split('\n');

  /* Comentário não é código — e comentário AQUI tem muitas linhas de propósito:
     é onde moram as medições de contraste, que citam hex e duração o tempo todo.
     Sem varredura com estado, o gate reprovava a própria documentação que a casa
     exige. Por isso o estado de "dentro de bloco" atravessa as linhas. */
  let dentroDeComentario = false;
  const codigoDe = (linha) => {
    let fora = '';
    let i = 0;
    while (i < linha.length) {
      if (dentroDeComentario) {
        const fim = linha.indexOf('*/', i);
        if (fim === -1) return fora;
        dentroDeComentario = false;
        i = fim + 2;
      } else {
        const ini = linha.indexOf('/*', i);
        if (ini === -1) return fora + linha.slice(i);
        fora += linha.slice(i, ini);
        dentroDeComentario = true;
        i = ini + 2;
      }
    }
    return fora;
  };

  linhas.forEach((linha, i) => {
    const codigo = codigoDe(linha);
    if (!codigo.trim()) return;

    for (const regra of REGRAS) {
      // Regra que só vale em certas declarações: a linha precisa ser uma delas,
      // ou a continuação de uma (shorthand quebrado em várias linhas).
      if (regra.linhaAlvo && !regra.linhaAlvo.test(codigo)) {
        const abertura = linhas
          .slice(Math.max(0, i - 4), i)
          .reverse()
          .find((l) => /[:;{}]/.test(l));
        if (!abertura || !regra.linhaAlvo.test(abertura) || /;|\}/.test(abertura)) continue;
      }
      regra.achar.lastIndex = 0;
      const hits = codigo.match(regra.achar);
      if (!hits) continue;
      const reais = hits.filter((h) => !(regra.excecoes ?? []).some((e) => e.test(h)));
      if (!reais.length || temEscape(linhas, i)) continue;
      achados.push({ arquivo: rel, linha: i + 1, regra, trecho: reais.join(', ') });
    }
  });
}

if (achados.length === 0) {
  console.log(`✓ identidade íntegra (${arquivos.length} arquivos de estilo)`);
  process.exit(0);
}

const porRegra = new Map();
for (const a of achados) porRegra.set(a.regra.id, [...(porRegra.get(a.regra.id) ?? []), a]);

console.error(`\n✗ ${achados.length} desvios da identidade em ${porRegra.size} regra(s)\n`);
for (const [, lista] of porRegra) {
  const { regra } = lista[0];
  console.error(`  ${regra.id} — ${regra.porque}`);
  console.error(`  use: ${regra.use}\n`);
  for (const a of lista.slice(0, 40)) {
    console.error(`    ${relative('.', a.arquivo)}:${a.linha}  ${a.trecho}`);
  }
  if (lista.length > 40) console.error(`    … e mais ${lista.length - 40}`);
  console.error('');
}
console.error('  Desvio legítimo? `/* token-ok: <motivo> */` dentro da regra.\n');
process.exit(1);
