#!/usr/bin/env node
/**
 * check-single-lockfile.mjs
 *
 * WHY THIS EXISTS
 * The reference platform (plataforma-viver-de-ia) carries FIVE lockfiles tracked in
 * git — yarn.lock, package-lock.json, bun.lock, bun.lockb and deno.lock — plus both
 * npm `overrides` and yarn `resolutions` with identical content in package.json. The
 * result is that nobody can say with confidence which versions actually ship, and its
 * own CLAUDE.md contradicts itself about whether to run `npm run dev` or `yarn dev`.
 *
 * That state is not reachable in one bad commit; it accumulates because nothing ever
 * says no. This says no. It runs in ~50ms and is the single BLOCKING pre-commit check.
 */
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const FORBIDDEN = ['yarn.lock', 'bun.lock', 'bun.lockb', 'pnpm-lock.yaml', 'deno.lock'];
const REQUIRED = 'package-lock.json';

const found = FORBIDDEN.filter((f) => existsSync(resolve(root, f)));

if (found.length > 0) {
  console.error(`\n✗ Foreign lockfile(s) found: ${found.join(', ')}`);
  console.error('  This project uses npm exclusively. Delete them and re-run `npm install`.\n');
  process.exit(1);
}

if (!existsSync(resolve(root, REQUIRED))) {
  console.error(`\n✗ ${REQUIRED} is missing. Run \`npm install\`.\n`);
  process.exit(1);
}

process.exit(0);
