#!/usr/bin/env -S npx tsx
/**
 * lint-ui-spec.ts — static checks for tests/specs/**\/*.spec.ts
 *
 * Severity:
 *   blocker → exit 2
 *   major   → exit 1
 *   minor   → exit 0 (warning only)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

interface Rule {
  name: string;
  re: RegExp;
  severity: 'blocker' | 'major' | 'minor';
  message: string;
}

const root = process.cwd();
const cfg = JSON.parse(readFileSync(join(root, 'tests-config.json'), 'utf8'));
const specsDir = join(root, cfg.layout.specs);

const rules: Rule[] = [
  {
    name: 'no-hard-wait',
    re: /\bwaitForTimeout\s*\(\s*\d+/,
    severity: 'blocker',
    message: 'page.waitForTimeout is forbidden. Use expect.poll or web-first assertions.',
  },
  { name: 'no-xpath', re: /xpath=/, severity: 'major', message: 'XPath in spec.' },
  {
    name: 'no-axios',
    re: /from\s*['"]axios['"]/,
    severity: 'blocker',
    message: 'Raw HTTP client in spec. Use generated typed client.',
  },
  {
    name: 'no-console-log',
    re: /\bconsole\.log\(/,
    severity: 'minor',
    message: 'console.log in spec.',
  },
  {
    name: 'no-set-timeout',
    re: /\bsetTimeout\s*\(/,
    severity: 'major',
    message: 'setTimeout in spec.',
  },
  {
    name: 'no-inline-page',
    re: /new\s+\w+Page\s*\(\s*page\s*\)/,
    severity: 'major',
    message: 'Page object instantiated inline. Move to fixture.',
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

const files = collect(specsDir);
let blockerCount = 0;
let majorCount = 0;
let minorCount = 0;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');

  for (const rule of rules) {
    lines.forEach((line, idx) => {
      if (rule.re.test(line)) {
        const tag = rule.severity.toUpperCase();
        console.error(`${tag}: ${file}:${idx + 1} [${rule.name}] ${rule.message}`);
        if (rule.severity === 'blocker') blockerCount++;
        else if (rule.severity === 'major') majorCount++;
        else minorCount++;
      }
    });
  }
}

console.log(
  `\nSummary: ${blockerCount} blocker, ${majorCount} major, ${minorCount} minor across ${files.length} spec(s).`,
);

if (blockerCount > 0) process.exit(2);
if (majorCount > 0) process.exit(1);
process.exit(0);
