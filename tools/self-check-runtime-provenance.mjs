#!/usr/bin/env node
// @ts-check
/**
 * RUNTIME-PROVENANCE SELF-CHECK — SERT KAPI (FAZ0).
 *
 * `tools/runtime-provenance.mjs`'in dürüstlük sözleşmelerini TAMAMEN SENTETİK
 * fixture'larla doğrular + repo'daki kommitlenmiş `docs/raporlar/TEST-SONUCLARI.json`
 * raporunun HEAD'e göre DÜRÜST olduğunu (bayat/SHA-uyuşmaz bir raporun "güncel PASS"
 * gibi sunulmadığını) zorlar (fail-closed).
 *
 * Çalıştır:  node tools/self-check-runtime-provenance.mjs  (npm run quality:runtime-provenance)
 */
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RUNTIME_SOURCE_TYPE,
  PROVENANCE_VERDICT,
  isListedOnlyReport,
  countObservedAttempts,
  verifyRuntimeProvenance,
  assertCommittedReportHonest,
} from './runtime-provenance.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (m) => errors.push(m);
const ok = (cond, m) => { if (!cond) fail(m); };

const SHA = 'a'.repeat(40);
const OTHER_SHA = 'b'.repeat(40);
const NOW = '2026-08-03T00:00:00.000Z';

/** Tam-taze-doğrulanabilir bir model iskeleti (VERIFIED beklenir). */
function goodModel(over = {}) {
  return {
    generatedAt: over.generatedAt || '2026-08-02T23:00:00.000Z',
    source: {
      sourceType: RUNTIME_SOURCE_TYPE,
      commitSha: SHA,
      runId: '30788568186',
      ...(over.source || {}),
    },
    runtime: { selectedThisRun: 56, observedAttempts: 56, ...(over.runtime || {}) },
    ...(over.provenance ? { provenance: over.provenance } : {}),
  };
}
const verify = (m, o = {}) => verifyRuntimeProvenance(m, { expectedSha: SHA, nowIso: NOW, ...o });

// ── POZITIF: geçerli + SHA eşleşen gerçek runtime provenance → VERIFIED ───────
{
  const r = verify(goodModel());
  ok(r.verdict === PROVENANCE_VERDICT.VERIFIED, `pozitif: tam+taze+SHA-eşleşen → VERIFIED (bulunan ${r.verdict}: ${r.reasons.join(',')})`);
  ok(r.observedExecution === true, 'pozitif: gözlemlenen yürütme true olmalı.');
}
// runId yereldeki gibi null ama requireRunId:false → yine VERIFIED
{
  const r = verify(goodModel({ source: { sourceType: RUNTIME_SOURCE_TYPE, commitSha: SHA, runId: null } }), { requireRunId: false });
  ok(r.verdict === PROVENANCE_VERDICT.VERIFIED, `pozitif: runId yok ama requireRunId:false → VERIFIED (${r.verdict})`);
}

// ── NEGATIF 1: provenance eksik (sourceType yok) → UNVERIFIED ─────────────────
{
  const r = verify(goodModel({ source: { sourceType: null, commitSha: SHA, runId: '1' } }));
  ok(r.verdict === PROVENANCE_VERDICT.UNVERIFIED && r.reasons.includes('sourcetype-missing-or-not-runtime'),
    'neg1: sourceType yok → UNVERIFIED.');
}
// sourceType yanlış (list vs run gibi) → UNVERIFIED
{
  const r = verify(goodModel({ source: { sourceType: 'playwright-list', commitSha: SHA, runId: '1' } }));
  ok(r.verdict === PROVENANCE_VERDICT.UNVERIFIED, 'neg1b: yanlış sourceType → UNVERIFIED.');
}

// ── NEGATIF 2: run ID eksik (requireRunId) → UNVERIFIED ───────────────────────
{
  const r = verify(goodModel({ source: { sourceType: RUNTIME_SOURCE_TYPE, commitSha: SHA, runId: null } }), { requireRunId: true });
  ok(r.verdict === PROVENANCE_VERDICT.UNVERIFIED && r.reasons.includes('runid-missing'), 'neg2: runId yok (requireRunId) → UNVERIFIED.');
}

// ── NEGATIF 3: SHA eksik → UNVERIFIED ─────────────────────────────────────────
{
  const r = verify(goodModel({ source: { sourceType: RUNTIME_SOURCE_TYPE, commitSha: null, runId: '1' } }));
  ok(r.verdict === PROVENANCE_VERDICT.UNVERIFIED && r.reasons.includes('commitsha-missing'), 'neg3: commitSha yok → UNVERIFIED.');
}

// ── NEGATIF 4: SHA mismatch → STALE ───────────────────────────────────────────
{
  const r = verify(goodModel({ source: { sourceType: RUNTIME_SOURCE_TYPE, commitSha: OTHER_SHA, runId: '1' } }));
  ok(r.verdict === PROVENANCE_VERDICT.STALE && r.reasons.includes('sha-mismatch'), `neg4: SHA uyuşmaz → STALE (${r.verdict}).`);
}

// ── NEGATIF 5: listed-only verisi runtime diye sunulması → UNVERIFIED ─────────
{
  // Ham rapor düzeyinde tespit
  const listReport = { suites: [{ specs: [{ tests: [{ results: [] }, { results: [] }] }] }] };
  ok(isListedOnlyReport(listReport) === true, 'neg5a: results yok → listed-only tespit.');
  ok(countObservedAttempts(listReport) === 0, 'neg5a: observed attempts 0.');
  const runReport = { suites: [{ specs: [{ tests: [{ results: [{ status: 'passed' }] }] }] }] };
  ok(isListedOnlyReport(runReport) === false, 'neg5b: results var → listed-only DEĞİL.');
  // Model düzeyinde: observedAttempts 0 → no-observed-execution
  const r = verify(goodModel({ runtime: { selectedThisRun: 56, observedAttempts: 0 } }));
  ok(r.verdict === PROVENANCE_VERDICT.UNVERIFIED && r.reasons.includes('no-observed-execution'),
    'neg5c: gözlemlenen yürütme yok → UNVERIFIED (listed-only PASS sayılmaz).');
}

// ── NEGATIF 6: stale rapor (generatedAt çok eski) → STALE ─────────────────────
{
  const r = verify(goodModel({ generatedAt: '2026-07-01T00:00:00.000Z' }));
  ok(r.verdict === PROVENANCE_VERDICT.STALE && r.reasons.includes('stale-generatedAt'), `neg6: bayat generatedAt → STALE (${r.verdict}).`);
}
// generatedAt geçersiz → UNVERIFIED
{
  const r = verify(goodModel({ generatedAt: 'not-a-date' }));
  ok(r.verdict === PROVENANCE_VERDICT.UNVERIFIED && r.reasons.includes('generatedAt-missing-or-invalid'), 'neg6b: geçersiz generatedAt → UNVERIFIED.');
}

// ── assertCommittedReportHonest: maskeleme throw, dürüst ilan geçer ───────────
{
  // Bayat rapor VERIFIED ilan ediyor (yalan) → throw
  let caught = false;
  try {
    assertCommittedReportHonest(goodModel({ source: { sourceType: RUNTIME_SOURCE_TYPE, commitSha: OTHER_SHA, runId: '1' }, provenance: { verdict: 'VERIFIED' } }), { expectedSha: SHA, nowIso: NOW });
  } catch { caught = true; }
  ok(caught, 'honest1: doğrulanamayan rapor VERIFIED ilan ederse → throw.');

  // Bayat rapor hiçbir şey ilan etmiyor (sessiz maskeleme) → throw
  caught = false;
  try {
    assertCommittedReportHonest(goodModel({ source: { sourceType: RUNTIME_SOURCE_TYPE, commitSha: OTHER_SHA, runId: '1' } }), { expectedSha: SHA, nowIso: NOW });
  } catch { caught = true; }
  ok(caught, 'honest2: doğrulanamayan+işaretsiz rapor → throw (sessiz bayat PASS engeli).');

  // Bayat rapor DÜRÜSTÇE STALE ilan ediyor → geçer
  caught = false;
  try {
    assertCommittedReportHonest(goodModel({ source: { sourceType: RUNTIME_SOURCE_TYPE, commitSha: OTHER_SHA, runId: '1' }, provenance: { verdict: 'STALE' } }), { expectedSha: SHA, nowIso: NOW });
  } catch { caught = true; }
  ok(!caught, 'honest3: dürüstçe STALE ilan eden rapor → geçer.');

  // Gerçekten VERIFIED rapor → geçer
  caught = false;
  try {
    assertCommittedReportHonest(goodModel(), { expectedSha: SHA, nowIso: NOW });
  } catch { caught = true; }
  ok(!caught, 'honest4: gerçekten VERIFIED rapor → geçer.');
}

// ── ENTEGRASYON: repo'daki kommitlenmiş runtime rapor HEAD'e göre dürüst mü ────
{
  const reportPath = resolve(root, 'docs/raporlar/TEST-SONUCLARI.json');
  if (existsSync(reportPath)) {
    let head = null;
    try { head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); } catch { head = null; }
    let committed = null;
    try { committed = JSON.parse(readFileSync(reportPath, 'utf8')); } catch { fail('entegrasyon: kommitlenmiş TEST-SONUCLARI.json parse edilemedi.'); }
    if (committed) {
      let threw = null;
      try {
        assertCommittedReportHonest(committed, { expectedSha: head, nowIso: new Date().toISOString() });
      } catch (e) {
        threw = e instanceof Error ? e.message : String(e);
      }
      ok(threw === null,
        `entegrasyon: kommitlenmiş TEST-SONUCLARI.json HEAD'e göre DÜRÜST olmalı ` +
        `(VERIFIED ya da açıkça STALE/UNVERIFIED). İhlal: ${threw}`);
    }
  }
}

// ── Sonuç ────────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} runtime-provenance self-check ihlali.`);
  process.exit(1);
}
console.log(
  'Runtime-provenance self-check geçti: negatif (sourceType/runId/SHA eksik, SHA-mismatch, ' +
    'listed-only-as-runtime, stale/geçersiz-tarih) + pozitif (VERIFIED) + committed-report honesty ' +
    '(HEAD doğrulaması). Bayat/SHA-uyuşmaz/listelenmiş-yalnız rapor güncel PASS gibi sunulamaz.'
);
