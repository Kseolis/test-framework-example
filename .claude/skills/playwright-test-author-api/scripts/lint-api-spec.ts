#!/usr/bin/env -S npx tsx
/**
 * lint-api-spec.ts — checks API spec files for forbidden patterns.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const cfg = JSON.parse(readFileSync(join(root, 'tests-config.json'), 'utf8'));
const apiSpecsDir = join(root, cfg.layout.specs, 'api');

if (!existsSync(apiSpecsDir)) {
  console.log('OK: no API spec directory yet.');
  process.exit(0);
}

const rules: {
  id: string;
  severity: 'blocker' | 'major' | 'minor';
  re: RegExp;
  message: string;
}[] = [
  {
    id: 'no-axios',
    severity: 'major',
    re: /from\s+['"]axios['"]/,
    message: 'Direct axios import. Use generated client.',
  },
  {
    id: 'no-fetch-url',
    severity: 'major',
    re: /\bfetch\s*\(\s*['"]https?:\/\//,
    message: 'Inline fetch with URL. Use API client.',
  },
  {
    id: 'no-schema-bypass',
    severity: 'major',
    re: /(?:\/\/.*disable.*schema|\.skipSchema\b)/,
    message: 'Schema validation disabled.',
  },
  {
    id: 'no-status-only',
    severity: 'minor',
    re: /^\s*expect\(response\.status\)\.toBe\(2\d\d\);\s*$/m,
    message: 'Only status asserted; add schema or body assertion.',
  },
  {
    id: 'no-message-assert',
    severity: 'minor',
    re: /\.message['"]\s*\)\.toBe\(['"]/,
    message: 'Asserting on error message string. Assert on code instead.',
  },
];

function collect(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) collect(p, acc);
    else if (p.endsWith('.spec.ts')) acc.push(p);
  }
  return acc;
}

const files = collect(apiSpecsDir);
let blockers = 0,
  majors = 0,
  minors = 0;

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    for (const r of rules) {
      if (r.re.test(line)) {
        console.error(`${file}:${idx + 1}  [${r.severity.toUpperCase()}][${r.id}] ${r.message}`);
        if (r.severity === 'blocker') blockers++;
        else if (r.severity === 'major') majors++;
        else minors++;
      }
    }
  });
}

console.error(
  `\n${files.length} API spec(s). blockers=${blockers} majors=${majors} minors=${minors}`,
);
if (blockers) process.exit(2);
if (majors) process.exit(1);
process.exit(0);
