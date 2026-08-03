#!/usr/bin/env node
// @ts-check
/**
 * AUDIT ORCHESTRATOR SELF-CHECK — SERT KAPI (FAZ 2, HANDOFF §3.8 + §3.2 exit matrisi).
 *
 * İki katman TAMAMEN SENTETİK doğrulanır (production'a bağlanmadan):
 *   A) Saf çekirdek: decideFinalExit exitMatrix() ile birebir; errorFingerprint
 *      stabilitesi; assertCrossOutputConsistency eksik-sayı yakalama.
 *   B) CLI uçtan uca: run-audit.mjs enjekte edilen sahte --test-cmd/--report-cmd
 *      ile sürülür; JSON yazan/yazmayan + exit-code kombinasyonları izole tmp
 *      dizininde denenir (docs/raporlar'a DOKUNMAZ). "test FAIL → rapor yine üretildi
 *      ama final non-zero" ve "rapor üretilmedi → test PASS olsa da non-zero" kanıtlanır.
 *
 * Çalıştır:  node tools/self-check-audit-orchestrator.mjs  (npm run quality:audit-orchestrator)
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  decideFinalExit,
  exitMatrix,
  errorFingerprint,
  assertCrossOutputConsistency,
  FINAL_REASON,
} from './audit-orchestrator-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = resolve(root, 'tools/run-audit.mjs');
const sha1 = (t) => createHash('sha1').update(String(t)).digest('hex');

const errors = [];
const fail = (m) => errors.push(m);
const ok = (cond, m) => { if (!cond) fail(m); };

// ── A) Saf çekirdek ──────────────────────────────────────────────────────────
// A1) Zorunlu exit matrisi (tek kaynak: exitMatrix) decideFinalExit ile tutarlı.
for (const row of exitMatrix()) {
  const d = decideFinalExit(row.input);
  ok(d.finalExit === row.expectExit, `A1 exit matrisi: "${row.label}" → beklenen ${row.expectExit}, gelen ${d.finalExit}`);
}

// A2) Kanonik gerekçeler doğru.
ok(decideFinalExit({ runtimeJsonExists: true, reportProduced: true, testExitCode: 0, reportExitCode: 0 }).reason === FINAL_REASON.OK, 'A2: hepsi yeşil → OK.');
ok(decideFinalExit({ runtimeJsonExists: false, reportProduced: false, testExitCode: 0, reportExitCode: 0 }).reason === FINAL_REASON.RUNTIME_JSON_MISSING, 'A2: JSON yok → RUNTIME_JSON_MISSING.');
ok(decideFinalExit({ runtimeJsonExists: true, staleDetected: true, reportProduced: false, testExitCode: 0, reportExitCode: 0 }).reason === FINAL_REASON.STALE_RUNTIME_JSON, 'A2: stale → STALE_RUNTIME_JSON.');
ok(decideFinalExit({ runtimeJsonExists: true, reportProduced: false, testExitCode: 0, reportExitCode: 0 }).reason === FINAL_REASON.REPORT_NOT_PRODUCED, 'A2: rapor üretilmedi (test PASS) → REPORT_NOT_PRODUCED.');
ok(decideFinalExit({ runtimeJsonExists: true, reportProduced: true, testExitCode: 0, reportExitCode: 2 }).reason === FINAL_REASON.REPORT_FAILED, 'A2: rapor non-zero → REPORT_FAILED.');
{
  const d = decideFinalExit({ runtimeJsonExists: true, reportProduced: true, testExitCode: 1, reportExitCode: 0 });
  ok(d.reason === FINAL_REASON.TEST_FAILED && d.finalExit === 1, 'A2: test FAIL + rapor OK → TEST_FAILED (rapor üretildi, final kırmızı).');
}
ok(decideFinalExit({ runtimeJsonExists: true, reportProduced: true, testExitCode: 1, reportExitCode: 1 }).reason === FINAL_REASON.TEST_FAILED_AND_REPORT_FAILED, 'A2: ikisi de FAIL → birleşik gerekçe.');

// A3) errorFingerprint: satır/sayı gürültüsü aynı parmak izine iner; farklı sınıf farklı.
{
  const fp1 = errorFingerprint('timeout at line 5 col 12', sha1);
  const fp2 = errorFingerprint('timeout at line 9 col 40', sha1);
  const fp3 = errorFingerprint('assertion mismatch', sha1);
  ok(fp1 === fp2, `A3: sayı gürültüsü aynı fingerprint vermeli (${fp1} vs ${fp2}).`);
  ok(fp1 !== fp3, 'A3: farklı hata sınıfı farklı fingerprint vermeli.');
  ok(/^[a-z]+#[0-9a-f]{8}$/.test(fp1), `A3: fingerprint formatı sınıf#hash olmalı (${fp1}).`);
}

// A4) assertCrossOutputConsistency: bir çıktıda eksik sayı → ihlal; hepsi varsa temiz.
{
  const numbers = [{ label: 'PASS', value: 42 }, { label: 'FAIL', value: 3 }];
  const clean = assertCrossOutputConsistency(numbers, [
    { name: 'md', text: 'PASS 42 · FAIL 3' },
    { name: 'html', text: '<b>42</b> geçti, 3 kaldı' },
  ]);
  ok(clean.length === 0, `A4: tutarlı çıktıda ihlal olmamalı: ${clean.join(';')}`);
  const dirty = assertCrossOutputConsistency(numbers, [{ name: 'md', text: 'PASS 42 · FAIL 7' }]);
  ok(dirty.length === 1, 'A4: eksik/uyumsuz sayı tam 1 ihlal vermeli.');
  // Kısmi eşleşme tuzağı: "3" değeri "42" içinde geçmiş sayılmamalı.
  const partial = assertCrossOutputConsistency([{ label: 'X', value: 3 }], [{ name: 'md', text: 'sadece 42 var' }]);
  ok(partial.length === 1, 'A4: 3, 42 içinde kısmi eşleşme sayılmamalı.');
}

// ── B) CLI uçtan uca (izole tmp; sahte test/report komutları) ─────────────────
const tmp = mkdtempSync(join(tmpdir(), 'audit-orch-'));
// Sahte "test" fixture: verilen yola minimal runtime JSON yazar (ya da yazmaz) ve
// istenen exit kodunu döndürür. Sahte "report" fixture: 4 zorunlu çıktıyı yazar
// (ya da yazmaz), istenen exit kodunu döndürür.
const writeJsonFx = join(tmp, 'fx-write-json.mjs');
writeFileSync(
  writeJsonFx,
  `import { writeFileSync } from 'node:fs';
const [,, out, startTime] = process.argv;
if (out !== 'SKIP') writeFileSync(out, JSON.stringify({ stats: { startTime }, suites: [] }));
`
);
const writeOutFx = join(tmp, 'fx-write-out.mjs');
writeFileSync(
  writeOutFx,
  `import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const [,, outDir, mode] = process.argv;
if (mode !== 'SKIP') {
  mkdirSync(outDir, { recursive: true });
  for (const f of ['TEST-SONUCLARI.json','SAYFA-TEST-SONUCLARI.md','SABAH-KALITE-OZETI.html','SABAH-TESLIM-MANIFEST.json'])
    writeFileSync(join(outDir, f), 'x');
}
`
);
const REQUIRED = ['TEST-SONUCLARI.json', 'SAYFA-TEST-SONUCLARI.md', 'SABAH-KALITE-OZETI.html', 'SABAH-TESLIM-MANIFEST.json'];

let caseNo = 0;
function scenario({ label, jsonOut, startTime, testExit, reportMode, reportExit, minStartTime, expectExit, expectReason, expectFilesExist }) {
  caseNo++;
  const jsonPath = join(tmp, `run-${caseNo}.json`);
  const outDir = join(tmp, `out-${caseNo}`);
  const testCmd = `node ${JSON.stringify(writeJsonFx)} ${jsonOut === 'SKIP' ? 'SKIP' : JSON.stringify(jsonPath)} ${JSON.stringify(startTime || '2026-08-02T06:00:00.000Z')}; exit ${testExit}`;
  const reportCmd = `node ${JSON.stringify(writeOutFx)} ${JSON.stringify(outDir)} ${reportMode || 'WRITE'}; exit ${reportExit}`;
  const args = [
    CLI,
    '--runtime-json', jsonPath,
    '--out-dir', outDir,
    '--test-cmd', testCmd,
    '--report-cmd', reportCmd,
  ];
  if (minStartTime) args.push('--min-start-time', minStartTime);
  const r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  const combined = `${r.stdout || ''}${r.stderr || ''}`;
  ok(r.status === expectExit, `B "${label}": beklenen exit ${expectExit}, gelen ${r.status}.`);
  if (expectReason) ok(combined.includes(expectReason), `B "${label}": gerekçe ${expectReason} loglanmalı.`);
  if (expectFilesExist !== undefined) {
    const allExist = REQUIRED.every((f) => existsSync(join(outDir, f)));
    ok(allExist === expectFilesExist, `B "${label}": rapor dosyaları ${expectFilesExist ? 'ÜRETİLMİŞ' : 'ÜRETİLMEMİŞ'} olmalı.`);
  }
}

try {
  scenario({ label: 'test PASS + report PASS → 0', jsonOut: 'WRITE', testExit: 0, reportExit: 0, expectExit: 0, expectReason: FINAL_REASON.OK, expectFilesExist: true });
  scenario({ label: 'test FAIL + report PASS → non-zero, rapor YİNE üretilir', jsonOut: 'WRITE', testExit: 1, reportExit: 0, expectExit: 1, expectReason: FINAL_REASON.TEST_FAILED, expectFilesExist: true });
  scenario({ label: 'test PASS + report FAIL → non-zero', jsonOut: 'WRITE', testExit: 0, reportExit: 3, expectExit: 1, expectReason: FINAL_REASON.REPORT_FAILED });
  scenario({ label: 'test FAIL + report FAIL → birleşik non-zero', jsonOut: 'WRITE', testExit: 1, reportExit: 1, expectExit: 1, expectReason: FINAL_REASON.TEST_FAILED_AND_REPORT_FAILED });
  scenario({ label: 'runtime JSON yok (test PASS) → non-zero, rapor ATLANIR', jsonOut: 'SKIP', testExit: 0, reportExit: 0, expectExit: 1, expectReason: FINAL_REASON.RUNTIME_JSON_MISSING, expectFilesExist: false });
  scenario({ label: 'stale JSON → non-zero, rapor ATLANIR', jsonOut: 'WRITE', startTime: '2020-01-01T00:00:00.000Z', testExit: 0, reportExit: 0, minStartTime: '2026-08-02T00:00:00.000Z', expectExit: 1, expectReason: FINAL_REASON.STALE_RUNTIME_JSON, expectFilesExist: false });
  scenario({ label: 'rapor üretilmedi (report exit0 ama dosya yok) → non-zero', jsonOut: 'WRITE', testExit: 0, reportMode: 'SKIP', reportExit: 0, expectExit: 1, expectReason: FINAL_REASON.REPORT_NOT_PRODUCED, expectFilesExist: false });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// ── Sonuç ────────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} audit-orchestrator self-check ihlali.`);
  process.exit(1);
}
console.log(
  'Audit-orchestrator self-check geçti: exit matrisi (7 satır) + kanonik gerekçeler + errorFingerprint stabilitesi + ' +
    'cross-output tutarlılık + 7 CLI uçtan-uca senaryo (test-FAIL→rapor yine üretilir/final kırmızı, ' +
    'rapor-üretilmedi→non-zero, runtime-JSON-yok/stale→hard-fail).'
);
