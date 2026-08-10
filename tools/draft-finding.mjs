#!/usr/bin/env node
// @ts-check
/**
 * WP-DRAFT — Kırmızı testten TASLAK bulgu önerisi (proposal-only CLI).
 *
 *   npm run report:draft                     # test-results/report.json
 *   npm run report:draft -- path/report.json # başka rapor
 *
 * Ne yapar:
 *  1. Playwright JSON raporunu okur (argv[2] veya test-results/report.json).
 *  2. Her non-green testi triage eder (REAL-RED / FIXED-CANDIDATE / FLAKY / KNOWN-BUG-GREEN).
 *  3. YALNIZ REAL-RED (ve registry'de OLMAYAN) testler için taslak bulgu iskeleti yazar:
 *     test-results/findings/_drafts/<slug>.json + draft-summary.json
 *  4. İnsan-okur triage özeti basar; fixed-candidate'ları reconcile'a yönlendirir.
 *
 * Doktrin: registry (tests/contracts/known-bugs.js) ASLA yazılmaz; kök-neden UYDURULMAZ
 * (possibleCauses=[], rootCauseCandidate=null, rootCause=null). Suggestion-only, exit 0.
 * Deterministik: wall-clock/rastgelelik YOK; provenance yalnız env'den enjekte edilir.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';
import { buildDrafts, TRIAGE } from './forensic-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Sıralı-anahtar, deterministik JSON serileştirme (byte-aynı çıktı). */
function stableStringify(value) {
  return JSON.stringify(value, sortedReplacer(), 2);
}
function sortedReplacer() {
  return function (_key, val) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.keys(val)
        .sort()
        .reduce((acc, k) => ((acc[k] = val[k]), acc), /** @type {Record<string,any>} */ ({}));
    }
    return val;
  };
}

// ── 1. Rapor ──────────────────────────────────────────────────────────────────
const reportRel = (process.argv[2] || 'test-results/report.json').trim();
const reportAbs = resolve(root, reportRel);
let report;
try {
  report = JSON.parse(readFileSync(reportAbs, 'utf8'));
} catch (error) {
  console.error(`report:draft HATASI — rapor okunamadı (${reportRel}): ${error.message}`);
  process.exit(1);
}

// ── 2. Taslakları üret (SAF; registry değişmez) ────────────────────────────────
const out = buildDrafts(report, KNOWN_BUGS, {
  runUrl: process.env.DRAFT_RUN_URL || null, // env-injected provenance (wall-clock YOK)
  commit: process.env.GITHUB_SHA || null,
  capturedAt: process.env.DRAFT_CAPTURED_AT || null,
});

// ── 3. Deterministik yazım ──────────────────────────────────────────────────────
const draftsDir = resolve(root, 'test-results/findings/_drafts');
rmSync(draftsDir, { recursive: true, force: true });
mkdirSync(join(draftsDir, 'drafts'), { recursive: true });
for (const d of out.drafts) {
  writeFileSync(join(draftsDir, 'drafts', `${d.slug}.json`), stableStringify(d.record) + '\n');
}
writeFileSync(join(draftsDir, 'draft-summary.json'), stableStringify(out.summary) + '\n');

// ── 4. İnsan-okur triage özeti ──────────────────────────────────────────────────
const c = out.summary.counts;
console.log(`report:draft — ${out.summary.total} test triyaj edildi (${reportRel})`);
console.log(`  ${TRIAGE.REAL_RED}:        ${c['REAL-RED']}   → ${out.drafts.length} yeni taslak, ${out.skippedAlreadyKnown.length} zaten kayıtlı (atlandı)`);
console.log(`  ${TRIAGE.FIXED_CANDIDATE}: ${c['FIXED-CANDIDATE']}   → \`npm run report:reconcile\` ile işle`);
console.log(`  ${TRIAGE.FLAKY}:           ${c['FLAKY']}   (retry-pass/timeout; taslaklanmaz)`);
console.log(`  ${TRIAGE.KNOWN_BUG_GREEN}: ${c['KNOWN-BUG-GREEN']}   (kayıtlı, beklendiği gibi; aksiyon yok)`);

if (out.drafts.length) {
  console.log(`\nYazılan taslaklar (test-results/findings/_drafts/drafts/):`);
  for (const d of out.drafts) console.log(`  • ${d.slug}.json   ${d.record.test.file}`);
}
if (out.fixedCandidates.length) {
  console.log(`\nReconcile edilecek fixed-candidate'lar:`);
  for (const f of out.fixedCandidates) console.log(`  • ${f.file} :: "${f.title}"`);
}
if (out.skippedAlreadyKnown.length) {
  console.log(`\nAtlandı (zaten registry'de):`);
  for (const s of out.skippedAlreadyKnown) console.log(`  • ${s.file} :: "${s.title}"`);
}

console.log(
  `\nSuggestion-only. Registry DEĞİŞMEDİ. Taslak = öneri; _todo tamamlanıp incelenmeden ` +
    `tests/contracts/known-bugs.js'e EKLENMEZ. (bkz. docs/BUG-REPORTING.md)`
);
process.exit(0); // triyaj asla non-zero değil; güvenlik kapısı prepareDraftBundle'da
