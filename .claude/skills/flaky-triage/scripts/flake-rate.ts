#!/usr/bin/env -S npx tsx
/**
 * flake-rate.ts — given a directory of Playwright JSON reports, computes
 * pass/fail rate per test and emits a Markdown table sorted by flakiness.
 *
 * Usage:
 *   tsx flake-rate.ts ./runs > FLAKE_REPORT.md
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? './runs';

interface Stat {
  passed: number;
  failed: number;
  flaky: number;
  total: number;
}
const stats = new Map<string, Stat>();

function bump(key: string, status: string) {
  const s = stats.get(key) ?? { passed: 0, failed: 0, flaky: 0, total: 0 };
  s.total++;
  if (status === 'passed' || status === 'expected') s.passed++;
  else if (status === 'failed' || status === 'unexpected' || status === 'timedOut') s.failed++;
  else if (status === 'flaky') s.flaky++;
  stats.set(key, s);
}

function walk(node: any) {
  for (const spec of node.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const key = `${spec.file ?? '?'} > ${spec.title}`;
      for (const r of t.results ?? []) bump(key, r.status);
    }
  }
  for (const child of node.suites ?? []) walk(child);
}

const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
for (const f of files) {
  const json = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  walk(json);
}

const rows = [...stats.entries()]
  .map(([title, s]) => ({ title, ...s, rate: s.failed / Math.max(s.total, 1) }))
  .filter((r) => r.rate > 0 && r.rate < 1)
  .sort((a, b) => b.rate - a.rate);

console.log('# Flake report\n');
console.log(`Runs analysed: ${files.length}\n`);
console.log('| Test | Total | Pass | Fail | Flake | Failure rate |');
console.log('|---|---:|---:|---:|---:|---:|');
for (const r of rows) {
  console.log(
    `| ${r.title} | ${r.total} | ${r.passed} | ${r.failed} | ${r.flaky} | ${(r.rate * 100).toFixed(0)}% |`,
  );
}
