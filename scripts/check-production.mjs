import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { setTimeout as esperar } from 'node:timers/promises';
import assert from 'node:assert/strict';

// Build real, sem conta, IA paga ou convites. Não usa o servidor de desenvolvimento.
const origem = 'http://127.0.0.1:3125';
const pasta = 'tmp/qualidade-producao';
await mkdir(pasta, { recursive: true });
const servidor = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3125'],
  { stdio: 'inherit' },
);
const encerrado = new Promise((resolve) => servidor.once('exit', resolve));
try {
  let pronta = false;
  for (let i = 0; i < 60; i++) {
    if (servidor.exitCode !== null) throw new Error('Build não iniciou');
    try {
      pronta = (await fetch(`${origem}/entrar`)).ok;
    } catch {
      /* Ainda iniciando. */
    }
    if (pronta) break;
    await esperar(500);
  }
  assert.ok(pronta, 'Entrada indisponível no build de produção');
  for (const host of ['subido.viverdeia.ai', 'projeto-subido.vercel.app']) {
    const r = await fetch(`${origem}/`, { redirect: 'manual', headers: { host } });
    assert.equal(r.status, 307);
    assert.equal(r.headers.get('location'), '/entrar');
  }
  assert.equal(
    (await fetch(`${origem}/preview/consultor`)).status,
    404,
    'Preview não pode abrir em produção',
  );
  assert.equal(
    (await fetch(`${origem}/api/consultor/responder`)).status,
    401,
    'API deve exigir sessão',
  );
  // Amostra fixa, nunca repetir até passar. Cada CLI abre um navegador novo.
  // A mediana reduz ruído de CPU do runner sem reduzir os limites do produto.
  const resultados = [];
  for (let amostra = 1; amostra <= 3; amostra++) {
    const auditoria = spawn(
      'npm',
      [
        'exec',
        '--yes',
        '--package=lighthouse@13.4.1',
        '--',
        'lighthouse',
        `${origem}/entrar`,
        '--chrome-flags=--headless --no-sandbox',
        '--only-categories=performance,accessibility,best-practices',
        '--output=json',
        `--output-path=${pasta}/lighthouse-${amostra}.json`,
        '--quiet',
      ],
      { stdio: 'inherit' },
    );
    assert.equal(
      await new Promise((resolve) => auditoria.once('exit', resolve)),
      0,
      'Lighthouse não concluiu',
    );
    const resultado = JSON.parse(await readFile(`${pasta}/lighthouse-${amostra}.json`, 'utf8'));
    assert.ok(!resultado.runtimeError, `Erro de navegação na amostra ${amostra}`);
    assert.ok(
      resultado.audits['cumulative-layout-shift'].numericValue <= 0.1,
      `Deslocamento de layout acima do limite na amostra ${amostra}`,
    );
    resultados.push(resultado);
  }
  const resumo = { amostras: resultados.length, categorias: {} };
  for (const [categoria, minimo] of [
    ['performance', 0.85],
    ['accessibility', 0.9],
    ['best-practices', 0.95],
  ]) {
    const notas = resultados.map((resultado) => resultado.categories[categoria].score);
    assert.ok(notas.every((nota) => Number.isFinite(nota) && nota >= 0 && nota <= 1));
    const mediana = [...notas].sort((a, b) => a - b)[1];
    resumo.categorias[categoria] = { notas, mediana, minimo };
    console.log(
      `${categoria}: ${notas.map((nota) => Math.round(nota * 100)).join(', ')}; mediana ${Math.round(mediana * 100)}/100 (mínimo ${minimo * 100})`,
    );
  }
  // Preservar também a amostra reprovada no artifact para diagnóstico.
  await writeFile(`${pasta}/resumo.json`, `${JSON.stringify(resumo, null, 2)}\n`);
  for (const [categoria, { mediana, minimo }] of Object.entries(resumo.categorias)) {
    assert.ok(mediana >= minimo, `Regressão em ${categoria}`);
  }
  console.log('Build público: acesso, previews, autenticação e orçamento de qualidade aprovados.');
} finally {
  servidor.kill('SIGTERM');
  await encerrado;
}
