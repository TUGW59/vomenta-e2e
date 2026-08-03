#!/usr/bin/env node
// @ts-check
/**
 * REPORT-HISTORY SELF-CHECK — SERT KAPI (FAZ 2, §item12 delta).
 *
 * TAMAMEN SENTETİK (production'a bağlanmadan) doğrular:
 *   A) buildHistorySnapshot şekli executive computeTrend UYUMLU; runId varsa uygun,
 *      yoksa DEĞİL (yerel koşum sahte trend üretmez).
 *   B) İki uygun snapshot → executive computeTrend GERÇEK delta (newFailures/
 *      fixedFailures) üretir; tek/uyumsuz snapshot → INSUFFICIENT_HISTORY.
 *   C) rotateHistory en yeni N'i tutar (nümerik runId sırası).
 *   D) CLI: runId yok → yazmaz+exit0; runId var → yazar+döndürür; bozuk JSON → non-zero.
 *
 * Çalıştır:  node tools/self-check-report-history.mjs  (npm run quality:report-history)
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, rmSync, readdirSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHistorySnapshot, isEligibleForTrend, historyFilename, rotateHistory, serializeSnapshot } from './report-history-lib.mjs';
import { computeTrend, SCHEMA_VERSION as EXEC_SV } from './executive-report-lib.mjs';
import { scanOutputLeaks } from './runtime-report-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = resolve(root, 'tools/append-runtime-history.mjs');
const errors = [];
const fail = (m) => errors.push(m);
const ok = (cond, m) => { if (!cond) fail(m); };

// Sentetik runtime modeli (buildResultModel benzeri; yalnız gerekli alanlar).
const modelOf = ({ commitSha, runId, fails }) => ({
  generatedAt: '2026-08-02T06:00:00.000Z',
  source: { commitSha, runId },
  runtime: { routeStatusTotals: { PASS: 50, FAIL: (fails || []).length, FLAKY: 0, BLOCKED: 3, NOT_RUN: 2 } },
  failingTestKeys: fails || [],
});

// ── A) snapshot şekli + uygunluk ─────────────────────────────────────────────
{
  const snap = buildHistorySnapshot(modelOf({ commitSha: 'abc123', runId: '111', fails: ['route:/a'] }), EXEC_SV);
  ok(snap.schemaVersion === EXEC_SV, 'A: snapshot executive schemaVersion ile damgalanmalı.');
  ok(snap.source.commitSha === 'abc123' && snap.source.runId === '111', 'A: source commitSha/runId taşınmalı.');
  ok(Array.isArray(snap.failingTestKeys) && snap.failingTestKeys[0] === 'route:/a', 'A: failingTestKeys taşınmalı.');
  ok(isEligibleForTrend(snap, EXEC_SV) === true, 'A: sha+runId olan snapshot trend\'e uygun olmalı.');
  const noRun = buildHistorySnapshot(modelOf({ commitSha: 'abc123', runId: null, fails: [] }), EXEC_SV);
  ok(isEligibleForTrend(noRun, EXEC_SV) === false, 'A: runId olmayan snapshot trend\'e UYGUN OLMAMALI (yerel).');
  const wrongSv = { ...snap, schemaVersion: EXEC_SV + 99 };
  ok(isEligibleForTrend(wrongSv, EXEC_SV) === false, 'A: şema uyumsuz snapshot uygun olmamalı.');
}

// ── B) iki snapshot → executive computeTrend GERÇEK delta ────────────────────
{
  const s1 = buildHistorySnapshot(modelOf({ commitSha: 'sha1', runId: '1', fails: ['route:/a', 'route:/b'] }), EXEC_SV);
  const s2 = buildHistorySnapshot(modelOf({ commitSha: 'sha2', runId: '2', fails: ['route:/b', 'route:/c'] }), EXEC_SV);
  const trend = computeTrend([s1, s2], EXEC_SV);
  ok(trend.status === 'OK', `B: iki uygun snapshot → OK trend beklenir (gelen ${trend.status}).`);
  ok(trend.newFailures.includes('route:/c') && !trend.newFailures.includes('route:/b'), 'B: /c yeni failure olmalı, /b değil.');
  ok(trend.fixedFailures.includes('route:/a') && !trend.fixedFailures.includes('route:/b'), 'B: /a düzelmiş olmalı, /b değil.');
  const one = computeTrend([s1], EXEC_SV);
  ok(one.status === 'INSUFFICIENT_HISTORY', 'B: tek snapshot → INSUFFICIENT_HISTORY (sahte trend yok).');
}

// ── C) rotateHistory en yeni N'i tutar (nümerik) ─────────────────────────────
{
  const names = Array.from({ length: 25 }, (_, i) => `executive-${i + 1}.json`);
  const { keep, remove } = rotateHistory(names, 20);
  ok(keep.length === 20 && remove.length === 5, 'C: 25→20 tut, 5 sil.');
  ok(keep.includes('executive-25.json') && !keep.includes('executive-5.json'), 'C: en yeni tutulmalı, en eski silinmeli.');
  ok(remove.includes('executive-1.json'), 'C: en eski (1) silinmeli.');
  // Nümerik sıralama: 100 > 20 (leksik olsaydı "100" < "20").
  const mixed = rotateHistory(['executive-20.json', 'executive-100.json', 'executive-3.json'], 2);
  ok(mixed.keep.includes('executive-100.json') && mixed.keep.includes('executive-20.json') && mixed.remove.includes('executive-3.json'), 'C: nümerik sıralama (100>20>3).');
}

// leak: snapshot metni temiz.
{
  const snap = buildHistorySnapshot(modelOf({ commitSha: 'deadbeef', runId: '9', fails: ['route:/x'] }), EXEC_SV);
  ok(scanOutputLeaks(serializeSnapshot(snap)).length === 0, 'snapshot metninde sızıntı olmamalı.');
}

// ── D) CLI uçtan uca (izole tmp) ─────────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'rep-hist-'));
function runCli(inputObj, historyDir, extra = []) {
  const inPath = join(tmp, `in-${Math.abs(JSON.stringify(inputObj).length)}-${extra.join('')}.json`);
  writeFileSync(inPath, typeof inputObj === 'string' ? inputObj : JSON.stringify(inputObj));
  return { r: spawnSync(process.execPath, [CLI, '--input', inPath, '--history-dir', historyDir, ...extra], { cwd: root, encoding: 'utf8' }), inPath };
}
try {
  // D1) runId yok → exit 0, dosya YAZILMAZ.
  const hd1 = join(tmp, 'h1');
  const { r: r1 } = runCli(modelOf({ commitSha: 'abc', runId: null, fails: [] }), hd1);
  ok(r1.status === 0, 'D1: runId yok → exit 0.');
  ok(!existsSync(hd1) || readdirSync(hd1).length === 0, 'D1: runId yok → history yazılmamalı.');

  // D2) runId var → exit 0, executive-<runId>.json yazılır.
  const hd2 = join(tmp, 'h2');
  const { r: r2 } = runCli(modelOf({ commitSha: 'abc', runId: '42', fails: ['route:/a'] }), hd2);
  ok(r2.status === 0, 'D2: runId var → exit 0.');
  ok(existsSync(join(hd2, 'executive-42.json')), 'D2: executive-42.json yazılmalı.');

  // D3) döndürme: max=2, üç ayrı runId → 2 kalır.
  const hd3 = join(tmp, 'h3');
  mkdirSync(hd3, { recursive: true });
  for (const id of ['1', '2', '3']) runCli(modelOf({ commitSha: 's', runId: id, fails: [] }), hd3, ['--max', '2']);
  const kept = readdirSync(hd3).filter((n) => /^executive-.+\.json$/.test(n)).sort();
  ok(kept.length === 2 && kept.includes('executive-3.json') && !kept.includes('executive-1.json'), `D3: max=2 döndürme (kalan ${kept.join(',')}).`);

  // D4) bozuk JSON → non-zero.
  const { r: r4 } = runCli('{ bozuk :', join(tmp, 'h4'));
  ok(r4.status !== 0, 'D4: bozuk JSON → non-zero.');

  // D5) girdi yok → non-zero.
  const r5 = spawnSync(process.execPath, [CLI, '--input', join(tmp, 'yok.json'), '--history-dir', join(tmp, 'h5')], { cwd: root, encoding: 'utf8' });
  ok(r5.status !== 0, 'D5: girdi yok → non-zero.');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// ── Sonuç ────────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} report-history self-check ihlali.`);
  process.exit(1);
}
console.log(
  'Report-history self-check geçti: snapshot şekli + executive-uyum, runId-yok→uygun-değil, ' +
    'iki snapshot→GERÇEK delta (new/fixed), tek→INSUFFICIENT_HISTORY, nümerik döndürme, sızıntı yok, ' +
    'CLI (yazmaz/yazar/döndürür/bozuk-JSON+girdi-yok non-zero). Yerel koşum sahte trend üretmez.'
);
