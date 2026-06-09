#!/usr/bin/env -S npx tsx
/**
 * compose-release.ts <version>
 * Stitches RUN_SUMMARY / COVERAGE_GAPS / FLAKE_REPORT / CONTRACT_DRIFT into docs/releases/<version>.md.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = process.cwd();
const version = process.argv[2];
if (!version) {
  console.error('Usage: compose-release.ts <version>');
  process.exit(2);
}

const sources = {
  run: 'RUN_SUMMARY.md',
  coverage: 'COVERAGE_GAPS.md',
  flake: 'FLAKE_REPORT.md',
  drift: 'CONTRACT_DRIFT.md',
};

const read = (p: string) =>
  existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : null;

const run = read(sources.run);
const coverage = read(sources.coverage);
const flake = read(sources.flake);
const drift = read(sources.drift);

if (!run && !coverage && !flake && !drift) {
  console.error('FAIL: no input files found.');
  process.exit(1);
}

// Heuristics
const passRate = run?.match(/Pass rate \|\s*([\d.]+)%/)?.[1];
const breakingCount = drift?.match(/breaking signals:\s*\*\*(\d+)\*\*/)?.[1];

let verdict = '✅ go';
if (passRate && Number(passRate) < 99) verdict = '⚠️ go-with-risks';
if (passRate && Number(passRate) < 95) verdict = '❌ no-go';
if (breakingCount && Number(breakingCount) > 0) verdict = '❌ no-go';

const md: string[] = [];
md.push(`# Release readiness — ${version}`);
md.push('');
md.push(`> Generated ${new Date().toISOString()} by release-report-composer.`);
md.push('');
md.push(`## Verdict: ${verdict}`);
md.push('');
if (run) {
  md.push('## Test execution');
  md.push(run);
  md.push('');
}
if (coverage) {
  md.push('## Coverage');
  md.push(coverage);
  md.push('');
}
if (flake) {
  md.push('## Flake report');
  md.push(flake);
  md.push('');
}
if (drift) {
  md.push('## Contract drift');
  md.push(drift);
  md.push('');
}

md.push('## Sign-off');
md.push('| Role | Name | Status |');
md.push('|---|---|---|');
md.push('| QA Lead |  | ⬜ |');
md.push('| Engineering Manager |  | ⬜ |');
md.push('| Product |  | ⬜ |');

const out = join(root, 'docs', 'releases', `${version}.md`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, md.join('\n'));
console.log(`OK: wrote ${out} with verdict ${verdict}.`);
