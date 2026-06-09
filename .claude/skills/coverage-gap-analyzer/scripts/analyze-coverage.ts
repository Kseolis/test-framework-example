#!/usr/bin/env -S npx tsx
/**
 * analyze-coverage.ts — produce COVERAGE_GAPS.md.
 *
 * Strategy: parse OpenAPI for endpoints, parse test files for tags,
 * intersect, emit gaps. AC tag matching is best-effort string match.
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const cfg = JSON.parse(readFileSync(join(root, 'tests-config.json'), 'utf8'));
const specsDir = join(root, cfg.layout.specs);
const pagesDir = join(root, cfg.layout.pages);
const openapiPath = join(root, cfg.openapi.source);

// --- Inventories ---

function collect(dir: string, suffix = '.ts', acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) collect(p, suffix, acc);
    else if (p.endsWith(suffix)) acc.push(p);
  }
  return acc;
}

// Endpoints from OpenAPI (very simple YAML scan, sufficient for a coverage gap heuristic)
function readEndpoints(): string[] {
  if (!existsSync(openapiPath)) return [];
  const raw = readFileSync(openapiPath, 'utf8');
  const endpoints: string[] = [];
  const lines = raw.split('\n');
  let currentPath = '';
  for (const line of lines) {
    const pm = /^\s{2}(\/[^:]+):\s*$/.exec(line);
    if (pm) currentPath = pm[1].trim();
    const mm = /^\s{4}(get|post|put|patch|delete|head|options):\s*$/i.exec(line);
    if (mm && currentPath) endpoints.push(`${mm[1].toUpperCase()} ${currentPath}`);
  }
  return endpoints;
}

// Page objects
function readPages(): string[] {
  return collect(pagesDir).map((p) => p.split('/').pop()!.replace(/\.ts$/, ''));
}

// Tags in tests
const testTagRe = /@(\w+):([^\s'"]+)/g;
function readCoveredTags(): { endpoints: Set<string>; acs: Set<string>; pages: Set<string> } {
  const endpoints = new Set<string>();
  const acs = new Set<string>();
  const pages = new Set<string>();
  for (const file of collect(specsDir, '.spec.ts')) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(testTagRe)) {
      const [, k, v] = m;
      if (k === 'endpoint') endpoints.add(v);
      else if (k === 'ac') acs.add(v);
      else if (k === 'page') pages.add(v);
    }
    // catch endpoint tags formatted as "@endpoint:METHOD /path"
    for (const m of src.matchAll(/@endpoint:([A-Z]+)\s+([^\s'"]+)/g)) {
      endpoints.add(`${m[1]} ${m[2]}`);
    }
  }
  return { endpoints, acs, pages };
}

const inventoryEndpoints = readEndpoints();
const inventoryPages = readPages();
const covered = readCoveredTags();

const missingEndpoints = inventoryEndpoints.filter((e) => !covered.endpoints.has(e));
const missingPages = inventoryPages.filter((p) => !covered.pages.has(p));

const md: string[] = [];
md.push(`# Coverage gaps — ${new Date().toISOString().slice(0, 10)}`);
md.push('');
md.push('## Endpoints');
md.push(
  `Inventory: ${inventoryEndpoints.length} | Covered: ${covered.endpoints.size} | Missing: ${missingEndpoints.length}`,
);
md.push('');
if (missingEndpoints.length) {
  md.push('### Missing endpoints');
  for (const e of missingEndpoints) md.push(`- [ ] ${e}`);
  md.push('');
}

md.push('## Pages');
md.push(
  `Inventory: ${inventoryPages.length} | Covered: ${covered.pages.size} | Missing: ${missingPages.length}`,
);
md.push('');
if (missingPages.length) {
  md.push('### Page objects without any test reference');
  for (const p of missingPages) md.push(`- [ ] ${p}`);
}

writeFileSync(join(root, 'COVERAGE_GAPS.md'), md.join('\n'));
console.log('OK: COVERAGE_GAPS.md written.');
