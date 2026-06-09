#!/usr/bin/env -S npx tsx
/**
 * contract-diff.ts — diffs the current OpenAPI-generated schema.d.ts against
 * the committed baseline and writes CONTRACT_DRIFT.md.
 * Exits 1 when breaking changes are detected and not annotated.
 *
 * Usage: tsx contract-diff.ts
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const cfg = JSON.parse(readFileSync(join(root, 'tests-config.json'), 'utf8'));
const generated = join(root, cfg.openapi.generated, 'schema.d.ts');
const snapshot = join(root, cfg.openapi.generated, '.snapshot', 'schema.previous.d.ts');

if (!existsSync(generated)) {
  console.error(`FAIL: ${generated} missing. Run gen-openapi-fetch.sh first.`);
  process.exit(2);
}
if (!existsSync(snapshot)) {
  console.log('NOTE: no baseline snapshot yet. Treating current as baseline.');
  writeFileSync(join(root, 'CONTRACT_DRIFT.md'), '# Contract drift report\n\nNo baseline yet.\n');
  process.exit(0);
}

const diff = execSync(`diff -u "${snapshot}" "${generated}" || true`).toString();

const breakingMarkers = [/-.*[A-Za-z_]+\??:/g, /^-\s*[A-Za-z]+:/gm];
let breaking = 0;
for (const re of breakingMarkers) {
  const m = diff.match(re);
  if (m) breaking += m.length;
}

const md = [
  '# Contract drift report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Raw diff',
  '```diff',
  diff || '(no changes)',
  '```',
  '',
  `Heuristic breaking signals: **${breaking}**`,
].join('\n');

writeFileSync(join(root, 'CONTRACT_DRIFT.md'), md);

if (breaking > 0) {
  console.error(`Detected ${breaking} potential breaking change(s). See CONTRACT_DRIFT.md`);
  process.exit(1);
}
console.log('OK: no breaking signals.');
