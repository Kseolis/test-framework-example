#!/usr/bin/env -S npx tsx
/**
 * risk-heuristic.ts — simple risk scorer.
 *
 * Input:  JSON via stdin: [{ id, scenario, probability: 1-3, impact: 1-3, areas?: string[] }]
 * Output: same array, sorted by score desc, with `priority` field added.
 *
 *   probability × impact = score
 *   score 7-9 → P0
 *   score 4-6 → P1
 *   score 1-3 → P2
 */
import { readFileSync } from 'node:fs';

interface Item {
  id: string;
  scenario: string;
  probability: 1 | 2 | 3;
  impact: 1 | 2 | 3;
  areas?: string[];
  score?: number;
  priority?: 'P0' | 'P1' | 'P2';
}

const stdin = readFileSync(0, 'utf8');
const items: Item[] = JSON.parse(stdin);

for (const it of items) {
  it.score = it.probability * it.impact;
  it.priority = it.score >= 7 ? 'P0' : it.score >= 4 ? 'P1' : 'P2';
}

items.sort((a, b) => b.score! - a.score!);
process.stdout.write(JSON.stringify(items, null, 2));
