#!/usr/bin/env node
/**
 * check-ds-drift.mjs — proves src/design-system/via/ still equals the pinned upstream.
 *
 * WHY THIS EXISTS
 * Vendoring has exactly one failure mode: someone edits the vendored copy. The moment
 * that happens the folder stops being a mirror and becomes a fork — upgrades start
 * producing conflicts, and the "just bump the SHA" story quietly dies.
 *
 * This re-runs the vendor into a temp dir at the same pin and diffs. Any difference
 * fails the PR. That is what lets the folder be treated as read-only generated code,
 * and it replaces the reference platform's approach of hand-maintaining ~250 lines of
 * allow-listed file paths across two files kept in sync by hand.
 *
 * If this fails legitimately (you meant to change the DS), the fix is upstream:
 * change it there, bump UPSTREAM_COMMIT in vendor-via.mjs, re-run `npm run vendor:via`.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CURRENT = resolve(ROOT, 'src/design-system/via');
const EXPECTED = join(tmpdir(), `via-drift-check-${process.pid}`);

function fileMap(root) {
  const map = new Map();
  if (!existsSync(root)) return map;
  const walk = (dir) => {
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else
        map.set(
          relative(root, full),
          createHash('sha256').update(readFileSync(full)).digest('hex'),
        );
    }
  };
  walk(root);
  return map;
}

if (!existsSync(CURRENT)) {
  console.error('\n✗ src/design-system/via/ não existe. Rode `npm run vendor:via`.\n');
  process.exit(1);
}

try {
  execFileSync('node', [resolve(ROOT, 'scripts/vendor-via.mjs')], {
    env: { ...process.env, VIA_OUT_DIR: EXPECTED, VIA_QUIET: '1' },
    stdio: ['ignore', 'ignore', 'inherit'],
  });

  const current = fileMap(CURRENT);
  const expected = fileMap(EXPECTED);

  const missing = [...expected.keys()].filter((f) => !current.has(f));
  const extra = [...current.keys()].filter((f) => !expected.has(f));
  const changed = [...expected.entries()]
    .filter(([f, h]) => current.has(f) && current.get(f) !== h)
    .map(([f]) => f);

  if (missing.length || extra.length || changed.length) {
    console.error('\n✗ O design system vendorizado divergiu do upstream pinado.\n');
    for (const f of changed) console.error(`  MODIFICADO  ${f}`);
    for (const f of missing) console.error(`  FALTANDO    ${f}`);
    for (const f of extra) console.error(`  EXTRA       ${f}`);
    console.error(
      '\n  src/design-system/via/ é gerado e não deve ser editado à mão.\n' +
        '  Mude no upstream, atualize UPSTREAM_COMMIT em scripts/vendor-via.mjs\n' +
        '  e rode `npm run vendor:via`.\n',
    );
    process.exit(1);
  }

  console.log(`✓ DS íntegro — ${current.size} arquivos batem com o upstream pinado`);
} finally {
  rmSync(EXPECTED, { recursive: true, force: true });
}
