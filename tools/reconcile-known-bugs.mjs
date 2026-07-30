#!/usr/bin/env node
// @ts-check
/**
 * WP-R3 — Nightly fixed-candidate önerisi.
 *
 *   npm run report:reconcile -- test-results/results.json
 *
 * Normal known-bug koşusundan "beklenmedik geçiş" (unexpected-pass) gösteren
 * knownBugGuard bulgularını bulur ve YALNIZ öneri üretir:
 *   test-results/findings/fixed-candidates.json
 *
 * BAĞLAYICI: registry değişmez, status güncellenmez, bug kapanmaz, guard kaldırılmaz.
 * Tek geçiş "verified fixed" DEĞİLDİR — bu yalnız WP-R4 (Bug Fix Verification) girdisidir.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';
import { reconcile } from './forensic-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`report:reconcile HATASI — ${message}`);
  process.exit(1);
}

const reportPath = (process.argv[2] || 'test-results/results.json').trim();
const abs = resolve(root, reportPath);

let report;
try {
  report = JSON.parse(readFileSync(abs, 'utf8'));
} catch (error) {
  fail(`Playwright JSON raporu okunamadı (${reportPath}): ${error.message}`);
}

const output = reconcile(report, KNOWN_BUGS, {
  generatedAt: new Date().toISOString(),
  commitSha: process.env.GITHUB_SHA || null,
});

const outDir = resolve(root, 'test-results', 'findings');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'fixed-candidates.json');
writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');

console.log(
  `fixed-candidates.json yazıldı: ${output.candidates.length} beklenmedik geçiş önerisi ` +
    `(registry DEĞİŞMEDİ; öneri — kapanış WP-R4).`
);
for (const c of output.candidates) console.log(`  • ${c.findingId}: ${c.reason} → ${c.recommendedStatus}`);
