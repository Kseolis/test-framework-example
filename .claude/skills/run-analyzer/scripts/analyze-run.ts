#!/usr/bin/env -S npx tsx
/**
 * analyze-run.ts — produces RUN_SUMMARY.md from playwright-report/results.json.
 */
import { readFileSync, existsSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const resultsPath = join(root, 'playwright-report', 'results.json');
const historyPath = join(root, 'runs', 'history.jsonl');
const out = join(root, 'RUN_SUMMARY.md');

if (!existsSync(resultsPath)) {
  console.error(`FAIL: ${resultsPath} not found.`);
  process.exit(2);
}

interface RunRow {
  title: string;
  file: string;
  project: string;
  durationMs: number;
  status: string;
  retries: number;
}

const rows: RunRow[] = [];

function walk(node: any, file = '') {
  for (const spec of node.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const lastResult = t.results?.[t.results.length - 1];
      rows.push({
        title: spec.title,
        file: spec.file ?? file,
        project: t.projectName ?? 'default',
        durationMs: lastResult?.duration ?? 0,
        status: lastResult?.status ?? 'unknown',
        retries: Math.max(0, (t.results?.length ?? 1) - 1),
      });
    }
  }
  for (const child of node.suites ?? []) walk(child, file || child.file || '');
}

const json = JSON.parse(readFileSync(resultsPath, 'utf8'));
walk(json);

const total = rows.length;
const passed = rows.filter((r) => r.status === 'passed' || r.status === 'expected').length;
const failed = rows.filter(
  (r) => r.status === 'failed' || r.status === 'unexpected' || r.status === 'timedOut',
).length;
const flaky = rows.filter(
  (r) => r.status === 'flaky' || (r.retries > 0 && r.status === 'passed'),
).length;
const durations = rows.map((r) => r.durationMs).sort((a, b) => a - b);
const p = (q: number) =>
  durations[Math.min(durations.length - 1, Math.floor(durations.length * q))] ?? 0;
const passRate = total ? passed / total : 0;
const flakyRate = total ? flaky / total : 0;

const slow = [...rows].sort((a, b) => b.durationMs - a.durationMs).slice(0, 10);
const fails = rows.filter((r) => r.status !== 'passed' && r.status !== 'expected');

const verdict = passRate >= 0.99 ? '✅ green' : passRate >= 0.9 ? '⚠️ yellow' : '❌ red';

const md: string[] = [];
md.push(`# Run summary — ${new Date().toISOString()}`);
md.push('');
md.push('| Metric | Value |');
md.push('|---|---:|');
md.push(`| Total tests | ${total} |`);
md.push(`| Passed | ${passed} |`);
md.push(`| Failed | ${failed} |`);
md.push(`| Flaky | ${flaky} |`);
md.push(`| Pass rate | ${(passRate * 100).toFixed(1)}% |`);
md.push(`| Flaky rate | ${(flakyRate * 100).toFixed(1)}% |`);
md.push(
  `| P50 / P95 duration | ${(p(0.5) / 1000).toFixed(1)}s / ${(p(0.95) / 1000).toFixed(1)}s |`,
);
md.push(`| Verdict | ${verdict} |`);
md.push('');

md.push('## Top 10 slowest');
md.push('| Test | Project | Duration |');
md.push('|---|---|---:|');
for (const r of slow)
  md.push(`| ${r.title} | ${r.project} | ${(r.durationMs / 1000).toFixed(1)}s |`);
md.push('');

md.push('## Failures');
md.push('| File | Test | Project | Duration |');
md.push('|---|---|---|---:|');
for (const r of fails)
  md.push(`| ${r.file} | ${r.title} | ${r.project} | ${(r.durationMs / 1000).toFixed(1)}s |`);
md.push('');

writeFileSync(out, md.join('\n'));
console.log(`OK: wrote ${out}`);

// Append to history
try {
  const record = {
    ts: Date.now(),
    total,
    passed,
    failed,
    flaky,
    passRate,
    p50: p(0.5),
    p95: p(0.95),
  };
  appendFileSync(historyPath, JSON.stringify(record) + '\n');
} catch {
  /* runs/ may not exist; non-fatal */
}
