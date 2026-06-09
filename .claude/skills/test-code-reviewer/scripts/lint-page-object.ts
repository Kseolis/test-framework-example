#!/usr/bin/env -S npx tsx
/**
 * lint-page-object.ts — static checks for tests/pages/**.ts
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const cfg = JSON.parse(readFileSync(join(root, 'tests-config.json'), 'utf8'));
const pagesDir = join(root, cfg.layout.pages);

if (!existsSync(pagesDir)) {
  console.log('OK: pages dir does not exist yet.');
  process.exit(0);
}

const rules: {
  id: string;
  severity: 'blocker' | 'major' | 'minor';
  re: RegExp;
  message: string;
}[] = [
  {
    id: 'no-expect-in-page',
    severity: 'major',
    re: /from\s+['"]@playwright\/test['"][^;]*expect/,
    message: 'Page object imports expect. Move assertions to spec.',
  },
  {
    id: 'no-public-locator',
    severity: 'major',
    re: /^\s*(public|readonly)\s+\w+\s*:\s*Locator\s*=/m,
    message: 'Public Locator field. Expose method instead.',
  },
  {
    id: 'no-hardcoded-url',
    severity: 'major',
    re: /https?:\/\/[^'"\s]+/,
    message: 'Hardcoded URL in page. Use relative path.',
  },
  {
    id: 'no-process-env',
    severity: 'minor',
    re: /process\.env\./,
    message: 'process.env in page object. Inject via constructor / env helper.',
  },
  {
    id: 'no-wait-timeout',
    severity: 'blocker',
    re: /\.waitForTimeout\s*\(/,
    message: 'waitForTimeout in page object.',
  },
];

function collect(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) collect(p, acc);
    else if (p.endsWith('.ts')) acc.push(p);
  }
  return acc;
}

const files = collect(pagesDir);
let blockers = 0,
  majors = 0,
  minors = 0;

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  // LOC threshold
  if (lines.length > 400) {
    console.error(`${file}:1  [MAJOR][page-loc] Page object exceeds 400 LOC. Consider splitting.`);
    majors++;
  }
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
  `\n${files.length} page object(s). blockers=${blockers} majors=${majors} minors=${minors}`,
);
if (blockers) process.exit(2);
if (majors) process.exit(1);
process.exit(0);
