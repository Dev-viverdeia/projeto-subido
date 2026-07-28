#!/usr/bin/env node
/**
 * Reprova quando um Server Component importa uma FUNÇÃO de um módulo `'use client'`.
 *
 * POR QUE ESTE SCRIPT EXISTE
 * `urlFiltros.ts` tinha `'use client'` e exportava `lerFiltrosIniciais`, uma função
 * pura chamada pelas páginas RSC de /solucoes e /formacoes. Em runtime o Next lança
 * "Attempted to call X() from the server but X is on the client" e a rota inteira
 * cai no error boundary — as duas telas ficaram quebradas para o usuário.
 *
 * Nenhum gate existente pega isso:
 *  · `tsc` não conhece a fronteira client/server;
 *  · `eslint` idem;
 *  · `npm run build` passa VERDE porque rotas dinâmicas (ƒ) não são
 *    pré-renderizadas — a chamada só acontece quando alguém abre a página.
 *
 * O QUE É PERMITIDO
 * Server Component pode importar COMPONENTES de módulo client (é o caso normal de
 * ilha) e pode importar TIPOS (apagados na compilação). O que não pode é importar
 * função/const de valor e executá-la no servidor. A heurística abaixo usa a
 * convenção do repo: export com inicial maiúscula = componente; `import type` /
 * `type X` dentro das chaves = tipo. O resto é valor.
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
const arquivos = globSync('src/**/*.{ts,tsx}', { cwd: RAIZ });

const ehClient = (rel) => {
  const conteudo = readFileSync(path.join(RAIZ, rel), 'utf8');
  return /^\s*(['"])use client\1/.test(conteudo);
};

/* Cache: um módulo é lido no máximo uma vez para saber se é client. */
const clientPorArquivo = new Map();
const clientCache = (rel) => {
  if (!clientPorArquivo.has(rel)) clientPorArquivo.set(rel, ehClient(rel));
  return clientPorArquivo.get(rel);
};

const resolver = (deArquivo, especificador) => {
  let base;
  if (especificador.startsWith('@/')) base = path.join('src', especificador.slice(2));
  else if (especificador.startsWith('.'))
    base = path.normalize(path.join(path.dirname(deArquivo), especificador));
  else return null; // pacote externo

  for (const sufixo of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    const alvo = base + sufixo;
    try {
      readFileSync(path.join(RAIZ, alvo));
      return alvo;
    } catch {
      /* tenta o próximo */
    }
  }
  return null;
};

const violacoes = [];

for (const rel of arquivos) {
  if (rel.includes('design-system/via/')) continue; // vendorizado
  if (clientCache(rel)) continue; // só Server Components nos interessam

  const conteudo = readFileSync(path.join(RAIZ, rel), 'utf8');
  const imports = conteudo.matchAll(/import\s+(type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g);

  for (const [, importTipo, nomes, especificador] of imports) {
    if (importTipo) continue; // `import type { … }` — apagado na compilação

    const alvo = resolver(rel, especificador);
    if (!alvo || !clientCache(alvo)) continue;

    const valores = nomes
      .split(',')
      .map((n) =>
        n
          .trim()
          .split(/\s+as\s+/)[0]
          .trim(),
      )
      .filter(Boolean)
      .filter((n) => !n.startsWith('type ')) // `{ type Foo }` inline
      .filter((n) => /^[a-z]/.test(n)); // maiúscula = componente, permitido

    if (valores.length > 0) {
      violacoes.push({ arquivo: rel, alvo, nomes: valores });
    }
  }
}

if (violacoes.length > 0) {
  console.error('\n✖ Server Component importando função de módulo client:\n');
  for (const v of violacoes) {
    console.error(`  ${v.arquivo}`);
    console.error(`    importa { ${v.nomes.join(', ')} } de ${v.alvo}  ('use client')`);
    console.error(
      `    → mova a função para um módulo NEUTRO (sem a diretiva) ou marque o import como \`import type\`.\n`,
    );
  }
  console.error(
    'Isto quebra a rota em RUNTIME e passa por tsc, eslint e build (rota dinâmica não é pré-renderizada).\n',
  );
  process.exit(1);
}

console.log(`✓ fronteira client/server íntegra (${arquivos.length} arquivos)`);
