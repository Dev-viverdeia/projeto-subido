#!/usr/bin/env node
/**
 * O CONTRATO DO BUILDER TEM UM DONO SÓ — e este script é o que garante isso.
 *
 * O schema Zod é usado dos dois lados de uma fronteira de runtime: o app Next
 * (Node, `import { z } from 'zod'`) e a Edge Function (Deno, `npm:zod@…`). São
 * dois módulos com a mesma definição, e "dois arquivos que precisam ser iguais"
 * é a receita conhecida de divergirem — o CLAUDE.md abre exatamente com a
 * história de três arquivos de instrução que se contradiziam.
 *
 * Então não há dois donos: `src/lib/builder/schema.ts` é a fonte, e o arquivo do
 * Deno é GERADO dela. A única diferença é o especificador do import, que é a
 * única coisa que os dois runtimes não conseguem compartilhar.
 *
 * `--check` reprova no CI se o gerado estiver desatualizado. É o mesmo desenho do
 * `check:ds-drift`: o que não é aplicado no CI é sugestão, e sugestão não
 * sobrevive.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const RAIZ = new URL('..', import.meta.url);
const FONTE = new URL('src/lib/builder/schema.ts', RAIZ);
const DESTINO = new URL('supabase/functions/_compartilhado/schema.ts', RAIZ);

/* Pinado no mesmo minor do package.json. Se o Zod subir lá e não aqui, a Edge
   Function passa a validar com outra versão do validador — divergência silenciosa
   pior que erro de build. */
const ZOD_DENO = 'npm:zod@4.4.3';

const AVISO = `/**
 * GERADO — não editar à mão.
 *
 * Fonte: src/lib/builder/schema.ts · regerar com \`npm run gen:schema-edge\`.
 * A ÚNICA diferença para a fonte é o especificador do import do Zod: o Deno
 * resolve por \`npm:\`, o Node por bare specifier. Todo o resto é idêntico por
 * construção, e o CI reprova se este arquivo estiver atrasado.
 */
`;

function gerar() {
  const fonte = readFileSync(FONTE, 'utf8');

  if (!/^import \{ z \} from 'zod';$/m.test(fonte)) {
    console.error(
      '✗ o import do Zod em src/lib/builder/schema.ts não está na forma esperada\n' +
        "  (esperado: import { z } from 'zod';)\n" +
        '  Este script troca essa linha exata — ajuste os dois juntos.',
    );
    process.exit(1);
  }

  return AVISO + fonte.replace(/^import \{ z \} from 'zod';$/m, `import { z } from '${ZOD_DENO}';`);
}

const conteudo = gerar();

if (process.argv.includes('--check')) {
  let atual = '';
  try {
    atual = readFileSync(DESTINO, 'utf8');
  } catch {
    /* Ausente conta como desatualizado. */
  }

  if (atual !== conteudo) {
    console.error(
      '✗ supabase/functions/_compartilhado/schema.ts está desatualizado\n' +
        '  Rode `npm run gen:schema-edge` e commite o resultado.',
    );
    process.exit(1);
  }

  console.log('✓ schema da Edge Function em dia com src/lib/builder/schema.ts');
  process.exit(0);
}

mkdirSync(dirname(DESTINO.pathname), { recursive: true });
writeFileSync(DESTINO, conteudo);
console.log('✓ supabase/functions/_compartilhado/schema.ts gerado');
