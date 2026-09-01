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
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));

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

/**
 * REGRA ESTRUTURAL — anel de foco morto.
 *
 * Não dá para pegar isto com regex por linha: o defeito é a AUSÊNCIA de uma regra
 * em outro lugar do arquivo. Um seletor que declara `box-shadow` e tem `:hover`
 * (prova de que é interativo) precisa declarar o próprio `:focus-visible`, porque
 * o anel do DS é box-shadow e o de `globals.css` usa `:where()` — especificidade
 * ZERO. Qualquer box-shadow de classe o apaga, e o build passa verde.
 *
 * Medido antes deste gate, com `:focus-visible` ativo e a transição terminada:
 * `.card` do PillarsIndex ficava com `outline: none` e sombra de foco resolvendo
 * `rgba(0,0,0,0) 0px 0px 0px 0px`. Seis seletores assim, incluindo os quatro
 * cards de pilar da landing — invisíveis para quem navega por teclado.
 *
 * `:focus-within` CONTA COMO DECLARAÇÃO DE FOCO. É o padrão certo para invólucro
 * que embrulha um único focável — a caixa do compositor do Builder põe o anel
 * nela e deixa o textarea sem moldura, para o conjunto ler como um objeto só.
 * O que este gate procura é a AUSÊNCIA de qualquer declaração de foco; quem
 * escreveu `:focus-within` decidiu onde o anel mora.
 */
function anelDeFocoMorto(linhas) {
  const texto = linhas.join('\n');
  const porBase = new Map();

  for (const [, sel, corpo] of texto.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const parte of sel.split(',')) {
      const limpo = parte.trim().split('*/').pop().trim();
      /* A ordem importa: `focus-visible` e `focus-within` antes de `focus`, ou a
         alternativa curta casa primeiro e deixa o sufixo na base. */
      const base = limpo.replace(/:(hover|focus-visible|focus-within|focus|active)\b.*$/, '');
      if (!base || base.startsWith('@')) continue;
      const d = porBase.get(base) ?? { sombra: false, hover: false, foco: false, linha: 0 };
      if (/box-shadow/.test(corpo)) d.sombra = true;
      if (/:hover\b/.test(limpo)) d.hover = true;
      if (/:focus-(visible|within)\b/.test(limpo)) d.foco = true;
      if (!d.linha) d.linha = linhas.findIndex((l) => l.includes(base)) + 1;
      porBase.set(base, d);
    }
  }

  return [...porBase.entries()]
    .filter(([, d]) => d.sombra && d.hover && !d.foco)
    .map(([base, d]) => ({ base, linha: d.linha }));
}

const REGRA_FOCO = {
  id: 'anel-de-foco-morto',
  porque: 'box-shadow de classe apaga o anel do DS — o foco fica INVISÍVEL e o build passa verde',
  use: '<seletor>:focus-visible { box-shadow: var(--app-ring), <sombra de repouso> }',
};

/**
 * REGRA ESTRUTURAL — token fantasma.
 *
 * `var(--via-fs-lead)` não existe. O navegador não avisa: a declaração inteira é
 * descartada como inválida e a propriedade cai na herança. Medido: o resumo da
 * ficha do Builder ficou em 16px herdados onde a intenção era 18 — sem erro em
 * lugar nenhum, com tsc, eslint e build todos verdes.
 *
 * A escala do DS tem `h4` (18px) e não tem "lead". Um token inventado não vira
 * erro, vira uma diferença de tamanho que ninguém consegue explicar depois.
 *
 * O conjunto de DEFINIDOS é deliberadamente largo — qualquer `--x:` em qualquer
 * CSS do repo, mais os que nascem em `style={{ '--x': … }}` no TSX (é assim que
 * o card de formação passa o campo de luz por slug). Largo porque o alvo é o
 * ERRO DE DIGITAÇÃO, não a disciplina de onde o token nasce; falso positivo aqui
 * custaria mais que o defeito.
 *
 * `var(--x, fallback)` passa: quem escreveu um fallback declarou que a ausência
 * é esperada.
 */
function tokensDefinidos() {
  const definidos = new Set();

  for (const rel of globSync(['src/**/*.css'], { cwd: RAIZ })) {
    const texto = readFileSync(new URL(rel, new URL('..', import.meta.url)), 'utf8');
    for (const [, nome] of texto.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)) definidos.add(nome);
  }

  /* Qualquer `'--x'` citado em TS/TSX conta como definido. São dois caminhos
     legítimos e nenhum dos dois se parece com uma declaração CSS:
       · `style={{ ['--logo-h' as string]: … }}` — variável passada por prop;
       · `variable: '--font-geist'` do next/font — o nome que o Next injeta.
     Nomear um token no TypeScript é sempre deliberado; erro de digitação em
     `var()` no CSS é que é acidente. */
  for (const rel of globSync(['src/**/*.ts', 'src/**/*.tsx'], { cwd: RAIZ })) {
    const texto = readFileSync(new URL(rel, new URL('..', import.meta.url)), 'utf8');
    for (const [, nome] of texto.matchAll(/['"](--[a-zA-Z0-9_-]+)['"]/g)) definidos.add(nome);
  }

  return definidos;
}

const REGRA_FANTASMA = {
  id: 'token-fantasma',
  porque: 'var() de token inexistente — a declaração some em silêncio e o valor vira herança',
  use: 'confira o nome na escala real (tokens.css / brand.css), ou dê um fallback ao var()',
};

/* Legibilidade da área autenticada. A plataforma chegou a usar 8–11px em
   orientações, ações e dados operacionais — tamanhos próprios de miniatura. O
   gate não proíbe a escala compacta por token, porque `--app-fs-micro` continua
   legítimo para eyebrow e metadado; ele impede apenas que novos números abaixo
   de 12px contornem a escala sem explicação.

   Duas miniaturas são exceções estruturais: a folha A4 reduzida do editor de
   propostas e o certificado reduzido da galeria. Nelas o texto representa uma
   peça completa em escala, não uma interface de leitura. */
const REGRA_FONTE_MINIMA = {
  id: 'fonte-operacional-minuscula',
  porque: 'texto abaixo de 12px na área autenticada — informação útil vira nota de rodapé',
  use: '--app-fs-micro (12px) ou um papel maior da escala de leitura',
};

const ARQUIVOS_ESCALA_APP = globSync(['src/app/(app)/**/*.module.css'], {
  cwd: RAIZ,
  exclude: [
    'src/app/(app)/propostas/_components/PreviewProposta.module.css',
    'src/app/(app)/certificados/_components/CertificadoVista.module.css',
  ],
});

const arquivos = globSync(ALVOS, { cwd: RAIZ, exclude: IGNORADOS });
const DEFINIDOS = tokensDefinidos();

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

  for (const { base, linha } of anelDeFocoMorto(linhas)) {
    if (temEscape(linhas, linha - 1)) continue;
    achados.push({ arquivo: rel, linha, regra: REGRA_FOCO, trecho: base });
  }

  linhas.forEach((linha, i) => {
    const codigo = codigoDe(linha);
    if (!codigo.trim()) return;

    /* `var(--x)` sem vírgula = sem fallback. Com fallback, a ausência do token é
       uma decisão de quem escreveu, não um erro de digitação. */
    for (const [, nome] of codigo.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g)) {
      if (DEFINIDOS.has(nome) || temEscape(linhas, i)) continue;
      achados.push({ arquivo: rel, linha: i + 1, regra: REGRA_FANTASMA, trecho: nome });
    }

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

for (const rel of ARQUIVOS_ESCALA_APP) {
  const linhas = readFileSync(new URL(rel, new URL('..', import.meta.url)), 'utf8').split('\n');

  linhas.forEach((linha, i) => {
    const match = linha.match(/font-size:\s*(\d*\.?\d+)(px|rem)\s*;/);
    if (!match || temEscape(linhas, i)) return;

    const valor = Number(match[1]);
    const pixels = match[2] === 'rem' ? valor * 16 : valor;
    if (pixels >= 12) return;

    achados.push({
      arquivo: rel,
      linha: i + 1,
      regra: REGRA_FONTE_MINIMA,
      trecho: `${match[1]}${match[2]} (${pixels.toFixed(2)}px)`,
    });
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
