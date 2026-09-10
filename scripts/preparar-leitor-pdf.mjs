import { cp, mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Assets gerados da mesma versão do leitor, servidos pelo próprio produto.
// Nenhum documento ou recurso privado passa por um visualizador externo.
const origem = resolve('node_modules/pdfjs-dist');
const { version } = JSON.parse(await readFile(resolve(origem, 'package.json'), 'utf8'));
const destino = resolve('public/vendor/pdfjs', version);
await mkdir(destino, { recursive: true });
await Promise.all(
  ['cmaps', 'standard_fonts', 'wasm', 'iccs', 'LICENSE', 'build/pdf.worker.min.mjs'].map((item) =>
    cp(resolve(origem, item), resolve(destino, item), { recursive: true }),
  ),
);
