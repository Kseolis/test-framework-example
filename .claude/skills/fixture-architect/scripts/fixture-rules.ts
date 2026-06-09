#!/usr/bin/env -S npx tsx
/**
 * fixture-rules.ts — static checks for tests/fixtures/*.ts files.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const cfg = JSON.parse(readFileSync(join(root, 'tests-config.json'), 'utf8'));
const fixturesDir = join(root, cfg.layout.fixtures);

const builtins = new Set(['page', 'request', 'browser', 'context', 'browserName', 'playwright']);

function collect(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) collect(p, acc);
    else if (p.endsWith('.ts')) acc.push(p);
  }
  return acc;
}

const files = collect(fixturesDir);
let violations = 0;

for (const file of files) {
  const src = readFileSync(file, 'utf8');

  // 1. Each fixture body must call `use(`
  const fixtureBlocks =
    src.match(/(\w+)\s*:\s*async\s*\(\s*\{[^}]*\}\s*,\s*use[^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\}/g) ??
    [];
  for (const block of fixtureBlocks) {
    if (!/await\s+use\s*\(/.test(block)) {
      console.error(`FAIL: ${file} — fixture without 'await use(...)' detected.`);
      violations++;
    }
  }

  // 2. Fixture names must not collide with built-ins
  const declarations = [...src.matchAll(/^\s*(\w+)\s*:\s*async\s*\(\s*\{/gm)];
  for (const [, name] of declarations) {
    if (builtins.has(name)) {
      console.error(`FAIL: ${file} — fixture name '${name}' collides with Playwright built-in.`);
      violations++;
    }
  }

  // 3. Worker-scope fixtures must not import test-scope ones (heuristic: scope tag in extend signature)
  if (/\.extend<[^,]*,\s*\{[^}]+\}\s*>/.test(src) && /\bpage\s*:/.test(src)) {
    // best-effort warning; full graph check requires AST
    console.warn(
      `WARN: ${file} — extends with worker fixtures referencing 'page'. Verify scope graph manually.`,
    );
  }
}

if (violations > 0) {
  console.error(`\n${violations} fixture rule violation(s).`);
  process.exit(1);
}
console.log(`OK: ${files.length} fixture file(s) clean.`);
