#!/usr/bin/env -S npx tsx
/**
 * extract-failing-step.ts — produce a compact JSON summary of the failure.
 * Reads test-results/results.json (Playwright JSON reporter) and emits per-failed-test:
 *   { file, title, errorMessage, durationMs, projectName, attachments }
 *
 * Usage:
 *   tsx extract-failing-step.ts > FAILURES.json
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const resultsPath = join(root, 'playwright-report', 'results.json');

if (!existsSync(resultsPath)) {
  console.error(`FAIL: ${resultsPath} not found. Run with --reporter=json,list,html.`);
  process.exit(2);
}

const results = JSON.parse(readFileSync(resultsPath, 'utf8'));

interface Out {
  file: string;
  title: string;
  projectName: string;
  durationMs: number;
  errorMessage: string;
  attachments: { name: string; path?: string }[];
}

const failures: Out[] = [];

function walk(suite: any, file: string) {
  if (suite.specs) {
    for (const spec of suite.specs) {
      for (const t of spec.tests ?? []) {
        for (const r of t.results ?? []) {
          if (r.status === 'failed' || r.status === 'timedOut' || r.status === 'unexpected') {
            failures.push({
              file: spec.file ?? file,
              title: spec.title,
              projectName: t.projectName,
              durationMs: r.duration,
              errorMessage: (r.errors?.[0]?.message ?? r.error?.message ?? '').slice(0, 2000),
              attachments: (r.attachments ?? []).map((a: any) => ({ name: a.name, path: a.path })),
            });
          }
        }
      }
    }
  }
  for (const child of suite.suites ?? []) walk(child, file || child.file || '');
}

walk(results, '');
process.stdout.write(JSON.stringify(failures, null, 2));
