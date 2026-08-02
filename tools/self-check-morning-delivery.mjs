#!/usr/bin/env node
// @ts-check
/**
 * MORNING DELIVERY SELF-CHECK — SERT KAPI (WP-MORNING Faz 4).
 *
 * `tools/run-morning-delivery.mjs` orchestrator'ının fail-safe sözleşmesini
 * TAMAMEN SENTETİK child-process fixture'larıyla, production'a BAĞLANMADAN
 * doğrular (handoff §FAZ4 "Sentetik orchestration testleri"):
 *
 *   1) Test PASS  → rapor üretilir, exit 0
 *   2) Test FAIL  → rapor üretilir, exit non-zero (false-green yok)
 *   3) JSON yok   → bayat rapor SİLİNİR, exit non-zero
 *   4) Bayat JSON (eski startTime) yeni koşum gibi KULLANILAMAZ → exit non-zero
 *   5) 0 seçilen  → exit non-zero
 *   6) Generator şema hatası → exit non-zero
 *   7) Güvenlik taraması fail (script/JWT sızıntısı) → validator reddeder (unit)
 *   8) Manifest eksik/yanlış-hash/kendini-hash → validator reddeder (unit)
 *   +  Allowlist eksik dosya → reddedilir (unit)
 *
 * Gerçek registry/rota kullanılır ('/' kayıtlı) ama baseline koşumu enjekte
 * fixture'dır; docs/raporlar'a DOKUNULMAZ (izole tmp --out-dir + test-results
 * altında izole input).
 *
 * Çalıştır:  node tools/self-check-morning-delivery.mjs  (npm run quality:delivery)
 */
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  rmSync,
  readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  GENERATED_DELIVERY,
  DELIVERY_ALLOWLIST,
  validateDeliverySecurity,
  validateManifestIntegrity,
  validateDeliveryAllowlist,
} from './run-morning-delivery.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORCH = resolve(root, 'tools/run-morning-delivery.mjs');

const errors = [];
const fail = (m) => errors.push(m);
const ok = (cond, m) => { if (!cond) fail(m); };

// ── Sentetik baseline fixture (production'a BAĞLANMAZ) ────────────────────────
// PLAYWRIGHT_JSON_OUTPUT_NAME'e Playwright-şekilli JSON yazar; FIXTURE_MODE ile
// pass/fail/none/empty/badschema/stale davranışı seçilir.
const FIXTURE = `
import { writeFileSync } from 'node:fs';
const out = process.env.PLAYWRIGHT_JSON_OUTPUT_NAME;
const mode = process.env.FIXTURE_MODE || 'pass';
const exit = Number(process.env.FIXTURE_EXIT || 0);
if (mode === 'none') { process.exit(exit); }        // hiç JSON yazmaz
const startTime = process.env.FIXTURE_START || new Date().toISOString();
let report;
if (mode === 'empty') report = { config:{}, stats:{ startTime }, suites: [] };
else if (mode === 'badschema') report = { config:{}, stats:{ startTime }, suites: {} };
else {
  const status = mode === 'fail' ? 'failed' : 'passed';
  const title = '[route:/] kayıtlı rota read-only baseline @smoke @route-baseline';
  report = { config:{}, stats:{ startTime }, suites: [{
    title:'root', file:'registered-routes-smoke.authed.spec.js',
    specs:[{ title, file:'registered-routes-smoke.authed.spec.js', tags:['@smoke','@route-baseline'],
      tests:[{ projectName:'chromium-authed', expectedStatus:'passed', annotations:[],
        results:[{ status, duration: 12 }] }] }] }] };
}
writeFileSync(out, JSON.stringify(report));
process.exit(exit);
`;

const workspace = mkdtempSync(join(tmpdir(), 'morning-delivery-selfcheck-'));
const fixturePath = join(workspace, 'fixture.mjs');
writeFileSync(fixturePath, FIXTURE);
let inputCounter = 0;

/** Orchestrator'ı izole input/out-dir + fixture baseline ile koşar. */
function runOrchestrator({ mode = 'pass', fixtureExit = 0, fixtureStart = null, seedGenerated = false } = {}) {
  const input = resolve(root, `test-results/.delivery-selfcheck-${process.pid}-${inputCounter++}.json`);
  const outDir = join(workspace, `out-${inputCounter}`);
  mkdirSync(outDir, { recursive: true });
  if (seedGenerated) {
    // Bayat "önceki koşum" snapshot'ı: silinmesi gerektiğini kanıtlamak için tohumla.
    for (const name of GENERATED_DELIVERY) writeFileSync(join(outDir, name), 'BAYAT-SNAPSHOT\n');
  }
  const env = {
    ...process.env,
    MORNING_INPUT: input,
    MORNING_OUT_DIR: outDir,
    MORNING_BASELINE_CMD: `node ${JSON.stringify(fixturePath)}`,
    MORNING_SKIP_SELFCHECK: '1',
    MORNING_SKIP_EXTERNAL: '1',
    MORNING_SKIP_LIST: '1',
    FIXTURE_MODE: mode,
    FIXTURE_EXIT: String(fixtureExit),
  };
  if (fixtureStart) env.FIXTURE_START = fixtureStart;
  const r = spawnSync(process.execPath, [ORCH], { cwd: root, encoding: 'utf8', env });
  // İzole input'u temizle (test-results kirlenmesin).
  if (existsSync(input)) rmSync(input, { force: true });
  return { status: r.status, outDir, stdout: r.stdout || '', stderr: r.stderr || '' };
}

const hasAllGenerated = (outDir) => GENERATED_DELIVERY.every((n) => existsSync(join(outDir, n)));

try {
  // ── 1) Test PASS → rapor üretilir, exit 0 ───────────────────────────────────
  {
    const r = runOrchestrator({ mode: 'pass' });
    ok(r.status === 0, `1: PASS koşumda exit 0 beklenir (status=${r.status}). stderr=${r.stderr.slice(-200)}`);
    ok(hasAllGenerated(r.outDir), '1: PASS koşumda 4 üretilen teslim dosyası oluşmalı.');
  }

  // ── 2) Test FAIL → rapor üretilir, exit non-zero ────────────────────────────
  {
    const r = runOrchestrator({ mode: 'fail', fixtureExit: 1 });
    ok(r.status !== 0, '2: FAIL koşumda non-zero exit beklenir (false-green yok).');
    ok(hasAllGenerated(r.outDir), '2: FAIL olsa bile rapor YİNE üretilmeli.');
  }

  // ── 3) JSON üretilmez → bayat rapor silinir, exit non-zero ───────────────────
  {
    const r = runOrchestrator({ mode: 'none', seedGenerated: true });
    ok(r.status !== 0, '3: JSON üretilmeyince non-zero exit beklenir.');
    ok(!hasAllGenerated(r.outDir), '3: bayat üretilmiş snapshot SİLİNMELİ (stale rapor sunulmaz).');
  }

  // ── 4) Bayat JSON (eski startTime) yeni koşum gibi kullanılamaz ──────────────
  {
    const r = runOrchestrator({ mode: 'pass', fixtureStart: '2020-01-01T00:00:00.000Z', seedGenerated: true });
    ok(r.status !== 0, '4: eski startTime\'lı JSON bayat sayılmalı → non-zero.');
    ok(!hasAllGenerated(r.outDir), '4: bayat koşumda üretilmiş snapshot silinmeli.');
  }

  // ── 5) 0 seçilen test → non-zero ────────────────────────────────────────────
  {
    const r = runOrchestrator({ mode: 'empty' });
    ok(r.status !== 0, '5: 0 seçilen test → non-zero exit beklenir.');
  }

  // ── 6) Generator şema hatası → non-zero ─────────────────────────────────────
  {
    const r = runOrchestrator({ mode: 'badschema' });
    ok(r.status !== 0, '6: geçersiz şema → generator fail → non-zero exit.');
  }

  // ── 7) Güvenlik validator'ı (unit) — script/JWT sızıntısı reddedilir ─────────
  {
    const cleanDir = join(workspace, 'sec-clean');
    mkdirSync(cleanDir, { recursive: true });
    writeFileSync(join(cleanDir, 'SABAH-KALITE-OZETI.html'), '<!doctype html><html><body><h1>Rapor</h1></body></html>');
    writeFileSync(join(cleanDir, 'SAYFA-TEST-SONUCLARI.md'), '# Sayfa\n');
    writeFileSync(join(cleanDir, 'TEST-SONUCLARI.json'), '{"ok":true}\n');
    writeFileSync(join(cleanDir, 'SABAH-TESLIM-MANIFEST.json'), '{"files":[]}\n');
    ok(validateDeliverySecurity(cleanDir).length === 0, '7: temiz teslim seti güvenlik taramasını geçmeli.');

    const badDir = join(workspace, 'sec-bad');
    mkdirSync(badDir, { recursive: true });
    writeFileSync(join(badDir, 'SABAH-KALITE-OZETI.html'), '<!doctype html><html><body><script>alert(1)</script></body></html>');
    writeFileSync(join(badDir, 'SAYFA-TEST-SONUCLARI.md'), '# ok\n');
    writeFileSync(join(badDir, 'TEST-SONUCLARI.json'), '{}\n');
    writeFileSync(join(badDir, 'SABAH-TESLIM-MANIFEST.json'), '{}\n');
    ok(validateDeliverySecurity(badDir).some((p) => p.includes('güvensiz') || p.includes('sızıntı')),
      '7: <script> içeren HTML güvenlik taramasında reddedilmeli.');

    const leakDir = join(workspace, 'sec-leak');
    mkdirSync(leakDir, { recursive: true });
    writeFileSync(join(leakDir, 'SABAH-KALITE-OZETI.html'), '<!doctype html><html><body>ok</body></html>');
    // Sentetik JWT (tracked source\'a düz yazılmaz — runtime\'da birleşir).
    const jwt = ['eyJhbGciOiJIUzI1NiJ9', 'eyJzdWIiOiIxMjMifQ', 'S3cr3tSignatureAAAA'].join('.');
    writeFileSync(join(leakDir, 'SAYFA-TEST-SONUCLARI.md'), `token ${jwt}\n`);
    writeFileSync(join(leakDir, 'TEST-SONUCLARI.json'), '{}\n');
    writeFileSync(join(leakDir, 'SABAH-TESLIM-MANIFEST.json'), '{}\n');
    ok(validateDeliverySecurity(leakDir).some((p) => p.includes('sızıntı')),
      '7: JWT sızıntısı güvenlik taramasında yakalanmalı.');
  }

  // ── 8) Manifest bütünlüğü (unit) — doğru / yanlış-hash / kendini-hash ────────
  {
    const okDir = join(workspace, 'man-ok');
    mkdirSync(okDir, { recursive: true });
    const content = 'merhaba\n';
    writeFileSync(join(okDir, 'TEST-SONUCLARI.json'), content);
    const goodManifest = {
      files: [{
        relativePath: 'docs/raporlar/TEST-SONUCLARI.json',
        size: Buffer.byteLength(content, 'utf8'),
        sha256: createHash('sha256').update(content).digest('hex'),
      }],
    };
    writeFileSync(join(okDir, 'SABAH-TESLIM-MANIFEST.json'), JSON.stringify(goodManifest));
    ok(validateManifestIntegrity(okDir).length === 0, '8: doğru hash/size manifest geçmeli.');

    const badHashDir = join(workspace, 'man-badhash');
    mkdirSync(badHashDir, { recursive: true });
    writeFileSync(join(badHashDir, 'TEST-SONUCLARI.json'), content);
    writeFileSync(join(badHashDir, 'SABAH-TESLIM-MANIFEST.json'), JSON.stringify({
      files: [{ relativePath: 'docs/raporlar/TEST-SONUCLARI.json', size: 999, sha256: 'deadbeef' }],
    }));
    ok(validateManifestIntegrity(badHashDir).length > 0, '8: yanlış hash/size reddedilmeli.');

    const selfHashDir = join(workspace, 'man-self');
    mkdirSync(selfHashDir, { recursive: true });
    writeFileSync(join(selfHashDir, 'SABAH-TESLIM-MANIFEST.json'), JSON.stringify({
      files: [{ relativePath: 'docs/raporlar/SABAH-TESLIM-MANIFEST.json', size: 1, sha256: 'x' }],
    }));
    ok(validateManifestIntegrity(selfHashDir).some((p) => p.includes('kendini')),
      '8: manifest kendini hash\'lerse reddedilmeli.');

    const missingManDir = join(workspace, 'man-missing');
    mkdirSync(missingManDir, { recursive: true });
    ok(validateManifestIntegrity(missingManDir).length > 0, '8: manifest yoksa reddedilmeli.');
  }

  // ── Allowlist (unit) — eksik teslim dosyası reddedilir ──────────────────────
  {
    const emptyDir = join(workspace, 'al-empty');
    mkdirSync(emptyDir, { recursive: true });
    ok(validateDeliveryAllowlist(emptyDir, false).length === DELIVERY_ALLOWLIST.length,
      'allowlist: boş dizinde 7 eksik dosya raporlanmalı.');

    const fullDir = join(workspace, 'al-full');
    mkdirSync(fullDir, { recursive: true });
    for (const name of DELIVERY_ALLOWLIST) writeFileSync(join(fullDir, name), 'x');
    ok(validateDeliveryAllowlist(fullDir, false).length === 0, 'allowlist: 7 dosya tamsa geçmeli.');
    // skipExternal modu: yalnız 4 üretilen dosya beklenir.
    const genOnly = join(workspace, 'al-gen');
    mkdirSync(genOnly, { recursive: true });
    for (const name of GENERATED_DELIVERY) writeFileSync(join(genOnly, name), 'x');
    ok(validateDeliveryAllowlist(genOnly, true).length === 0, 'allowlist: skipExternal modunda 4 üretilen dosya yeterli.');
  }
} finally {
  rmSync(workspace, { recursive: true, force: true });
  // test-results altında izole input izi kalmadığını garanti et.
  const trace = resolve(root, 'test-results');
  if (existsSync(trace)) {
    for (const f of readdirSync(trace)) {
      if (f.startsWith('.delivery-selfcheck-')) rmSync(resolve(trace, f), { force: true });
    }
  }
}

// ── Sonuç ────────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} morning-delivery self-check ihlali.`);
  process.exit(1);
}
console.log(
  'Morning-delivery self-check geçti: 8 sözleşme (PASS→rapor+exit0, FAIL→rapor+non-zero, ' +
    'JSON-yok→stale-silinir+non-zero, bayat-JSON→non-zero, 0-seçilen→non-zero, şema-hatası→non-zero, ' +
    'güvenlik-taraması reddi, manifest bütünlüğü+kendini-hash reddi, allowlist exact). ' +
    'Orchestrator fail-closed; production\'a bağlanmadı.'
);
