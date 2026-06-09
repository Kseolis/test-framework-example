#!/usr/bin/env -S npx tsx
/**
 * factory-rules.ts — static checks for tests/factories/*.factory.ts files.
 * Exits 1 if violations are found.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const cfg = JSON.parse(readFileSync(join(root, 'tests-config.json'), 'utf8'));
const factoriesDir = join(root, cfg.layout.factories);

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    yield (statSync(p).isDirectory() ? [...walk(p)] : [p]) as unknown as string;
  }
}

const files: string[] = [];
function collect(dir: string) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) collect(p);
    else if (p.endsWith('.factory.ts')) files.push(p);
  }
}
collect(factoriesDir);

const forbidden: { re: RegExp; reason: string }[] = [
  { re: /\bfetch\s*\(/, reason: 'Network call inside factory file. Move to seed() helper.' },
  { re: /\baxios\b/, reason: 'Network client in factory. Forbidden.' },
  {
    re: /\bDate\.now\s*\(/,
    reason: 'Date.now() at top level breaks determinism. Use faker.date.*',
  },
  { re: /\bMath\.random\s*\(/, reason: 'Math.random breaks determinism. Use faker.* with SEED.' },
  { re: /^\s*let\s+\w+\s*[:=]/m, reason: 'Top-level mutable state in factory file.' },
  {
    re: /class\s+\w+\s+extends\s+\w+Factory/,
    reason: 'Factory inheritance forbidden. Use overrides + transient.',
  },
];

let violations = 0;
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  for (const rule of forbidden) {
    if (rule.re.test(src)) {
      console.error(`FAIL: ${file}\n   ${rule.reason}`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\n${violations} factory rule violation(s).`);
  process.exit(1);
}
console.log(`OK: ${files.length} factory file(s) clean.`);
