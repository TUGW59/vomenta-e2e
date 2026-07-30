#!/usr/bin/env node
// @ts-check
/**
 * WP-R3 — Forensik mod negatif self-check (kaçışsız kapı).
 *
 * Forensik otomasyonun güvenlik ve dürüstlük kontratlarını her koşuda kanıtlar:
 *  1. Bilinmeyen finding id → hard failure.
 *  2. CLI id / FORENSIC_BUG env uyuşmazlığı → hard failure.
 *  3. knownBugGuard forensik modu: eşleşen id'de test.fail() ATLANIR; eşleşmeyende UYGULANIR.
 *  4. Upload allowlist: beklenmeyen dosya → REDDET.
 *  5. Seed'li secret içeren JSON → REDDET (upload'a alınmaz).
 *  6. Seed'li secret içeren trace girdisi → tarayıcı YAKALAR.
 *  7. Güvensiz/temiz farketmez trace (*.zip) → upload'a ALINMAZ (lokal-only).
 *  8. Video (*.webm) → production upload allowlist'inde REDDEDİLİR.
 *  9. Beklenmedik geçiş → fixed-candidate önerisi üretilir.
 * 10. Normal beklenen-başarısızlık / permanent → fixed-candidate ÜRETİLMEZ.
 * 11. Forensik araçlar registry'yi YAZMAZ (statik kaynak taraması + fingerprint).
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';
import { forensicModeActive } from '../tests/fixtures/forensic.js';
import { knownBugGuard } from '../tests/helpers.js';
import {
  resolveFinding,
  assertForensicCliMatchesEnv,
  scanEntriesForSecrets,
  scanTraceZip,
  prepareUploadBundle,
  reconcile,
  classifyRunResult,
  registryFingerprint,
  UPLOAD_ALLOWLIST,
  LOCAL_ONLY_PATTERNS,
} from './forensic-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (label, fn) => {
  try {
    fn();
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
};

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const SEED_JWT =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJVadQssw5c';
const scratch = resolve(root, 'test-results', '.forensic-selfcheck');
rmSync(scratch, { recursive: true, force: true });
mkdirSync(scratch, { recursive: true });

function makeDir(name, files) {
  const dir = join(scratch, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const [fname, content] of Object.entries(files)) {
    writeFileSync(join(dir, fname), content);
  }
  return dir;
}

// ── 1. Bilinmeyen finding id ─────────────────────────────────────────────────
check('bilinmeyen id resolveFinding hata verir', () => {
  assert.throws(() => resolveFinding('DEFINITELY-NOT-A-BUG'), /Bilinmeyen bulgu/);
  assert.ok(resolveFinding('B4').id === 'B4');
});
check('bilinmeyen id knownBugGuard hata verir', () => {
  const fakeTest = { fail: () => {} };
  assert.throws(() => knownBugGuard(fakeTest, 'NOPE-XYZ'), /bilinmeyen bulgu/i);
});

// ── 2. CLI / env uyuşmazlığı ──────────────────────────────────────────────────
check('CLI/env id uyuşmazlığı hard failure', () => {
  assert.throws(() => assertForensicCliMatchesEnv('B4', 'B5'), /uyuşmazlık/);
  assert.doesNotThrow(() => assertForensicCliMatchesEnv('B4', 'B4'));
  assert.doesNotThrow(() => assertForensicCliMatchesEnv('B4', ''));
  assert.doesNotThrow(() => assertForensicCliMatchesEnv('B4', undefined));
});

// ── 3. knownBugGuard forensik modu ────────────────────────────────────────────
check('forensicModeActive yalnız tam eşleşmede true', () => {
  assert.equal(forensicModeActive('B1', { FORENSIC_BUG: 'B1' }), true);
  assert.equal(forensicModeActive('B1', { FORENSIC_BUG: 'B2' }), false);
  assert.equal(forensicModeActive('B1', {}), false);
  assert.equal(forensicModeActive('B1', { FORENSIC_BUG: ' ' }), false);
});
check('knownBugGuard: forensik eşleşmede test.fail ATLANIR, aksi halde UYGULANIR', () => {
  const prev = process.env.FORENSIC_BUG;
  try {
    let calls = 0;
    const fakeTest = { fail: () => { calls++; } };
    // normal: fail() çağrılır
    delete process.env.FORENSIC_BUG;
    knownBugGuard(fakeTest, 'B1');
    assert.equal(calls, 1, 'normal koşuda test.fail çağrılmalı');
    // forensik eşleşme: fail() atlanır
    process.env.FORENSIC_BUG = 'B1';
    knownBugGuard(fakeTest, 'B1');
    assert.equal(calls, 1, 'forensik eşleşmede test.fail ATLANMALI');
    // forensik farklı id: fail() yine çağrılır
    process.env.FORENSIC_BUG = 'B2';
    knownBugGuard(fakeTest, 'B1');
    assert.equal(calls, 2, 'forensik farklı id\'de test.fail çağrılmalı');
  } finally {
    if (prev === undefined) delete process.env.FORENSIC_BUG;
    else process.env.FORENSIC_BUG = prev;
  }
});

// ── 4-5-7-8. Upload allowlist / sanitizer kapısı ──────────────────────────────
check('temiz bundle: 4 güvenli dosya kopyalanır; trace/video lokal-only', () => {
  const dir = makeDir('clean', {
    'candidate-update.json': '{"findingId":"B4","result":"reproduced"}',
    'network-summary.json': '{"total":0,"requests":[]}',
    'metadata.json': '{"findingId":"B4"}',
    'safe-final-state.png': PNG,
    'trace.zip': 'PK-fake',
    'video.webm': 'fake-webm',
    'network-summary.SKIPPED.txt': 'skip notu',
  });
  const b = prepareUploadBundle(dir);
  assert.deepEqual(b.rejected, [], `beklenmeyen ret: ${JSON.stringify(b.rejected)}`);
  assert.deepEqual([...b.copied].sort(), [...UPLOAD_ALLOWLIST].sort());
  assert.ok(b.skippedLocal.includes('trace.zip'), 'trace.zip upload dışı olmalı');
  assert.ok(b.skippedLocal.includes('video.webm'), 'video.webm upload dışı olmalı');
  // upload/ altında ne zip ne webm bulunmalı
  const uploaded = readdirSync(b.uploadDir);
  assert.ok(!uploaded.some((f) => /\.(zip|webm|mp4)$/i.test(f)), 'upload/ trace/video içermemeli');
});
check('allowlist dışı beklenmeyen dosya REDDEDİLİR', () => {
  const dir = makeDir('unexpected', {
    'metadata.json': '{"ok":true}',
    'secrets.txt': 'rasgele dosya',
  });
  const b = prepareUploadBundle(dir);
  assert.ok(b.rejected.some((r) => r.name === 'secrets.txt'), 'secrets.txt reddedilmeli');
});
check('seed\'li secret içeren JSON REDDEDİLİR (upload\'a alınmaz)', () => {
  const dir = makeDir('leaky-json', {
    'network-summary.json': `{"note":"jwt ${SEED_JWT}"}`,
    'metadata.json': '{"ok":true}',
  });
  const b = prepareUploadBundle(dir);
  assert.ok(
    b.rejected.some((r) => r.name === 'network-summary.json'),
    'sızıntılı JSON reddedilmeli'
  );
  assert.ok(!b.copied.includes('network-summary.json'), 'sızıntılı JSON kopyalanmamalı');
});
check('geçersiz PNG imzası REDDEDİLİR', () => {
  const dir = makeDir('bad-png', {
    'safe-final-state.png': 'not-a-png',
    'metadata.json': '{"ok":true}',
  });
  const b = prepareUploadBundle(dir);
  assert.ok(b.rejected.some((r) => r.name === 'safe-final-state.png'), 'geçersiz PNG reddedilmeli');
});
check('video production upload allowlist\'inde YOK', () => {
  assert.ok(!UPLOAD_ALLOWLIST.some((n) => /\.(webm|mp4)$/i.test(n)), 'allowlist video içermemeli');
  assert.ok(LOCAL_ONLY_PATTERNS.some((re) => re.test('video.webm')), 'webm lokal-only olmalı');
  assert.ok(LOCAL_ONLY_PATTERNS.some((re) => re.test('trace.zip')), 'zip lokal-only olmalı');
});

// ── 6. Trace secret taraması (pure + gerçek zip) ──────────────────────────────
check('seed\'li secret içeren trace girdisi taranınca YAKALANIR (pure)', () => {
  const hits = scanEntriesForSecrets([
    { name: 'trace.trace', content: 'normal' },
    { name: 'resources/0.dat', content: `authorization: Bearer ${SEED_JWT}` },
  ]);
  assert.ok(hits.length > 0, 'seed\'li trace girdisi yakalanmalı');
  const clean = scanEntriesForSecrets([{ name: 'x', content: 'temiz metin' }]);
  assert.deepEqual(clean, [], 'temiz girdi sızıntı sayılmamalı');
});
check('gerçek trace.zip taraması seed\'li secret\'ı yakalar (unzip varsa)', () => {
  let hasZip = true;
  try {
    execFileSync('zip', ['-v'], { stdio: 'ignore' });
    execFileSync('unzip', ['-v'], { stdio: 'ignore' });
  } catch {
    hasZip = false;
  }
  if (!hasZip) {
    console.log('  (bilgi) zip/unzip yok — gerçek-zip trace taraması atlandı; pure test kapsıyor.');
    return;
  }
  const zdir = join(scratch, 'ztrace');
  rmSync(zdir, { recursive: true, force: true });
  mkdirSync(zdir, { recursive: true });
  writeFileSync(join(zdir, 'leak.txt'), `session token ${SEED_JWT}`);
  const zipPath = join(zdir, 'trace.zip');
  execFileSync('zip', ['-q', '-j', zipPath, join(zdir, 'leak.txt')], { stdio: 'ignore' });
  const scan = scanTraceZip(zipPath, join(zdir, 'tmp'));
  assert.ok(scan.hits.length > 0, `gerçek trace.zip\'te seed yakalanmalı (tool=${scan.tool})`);
});

// ── 9-10. reconcile: fixed-candidate önerisi ──────────────────────────────────
function specNode(finding, expectedStatus, status) {
  return {
    file: finding.test.file,
    title: finding.test.title,
    tests: [{ expectedStatus, results: [{ status }] }],
  };
}
check('beklenmedik geçiş → fixed-candidate; normal/permanent → üretilmez', () => {
  const b1 = KNOWN_BUGS.find((b) => b.id === 'B1');
  const b2 = KNOWN_BUGS.find((b) => b.id === 'B2');
  const b7 = KNOWN_BUGS.find((b) => b.id === 'B7'); // permanent
  const report = {
    suites: [
      {
        specs: [
          specNode(b1, 'failed', 'passed'), // unexpected-pass → aday
          specNode(b2, 'failed', 'failed'), // beklenen başarısızlık → aday DEĞİL
          specNode(b7, 'passed', 'passed'), // permanent geçti → aday DEĞİL
        ],
        suites: [],
      },
    ],
  };
  const out = reconcile(report, KNOWN_BUGS, { generatedAt: '2026-07-30T00:00:00.000Z' });
  const ids = out.candidates.map((c) => c.findingId);
  assert.deepEqual(ids, ['B1'], `yalnız B1 aday olmalı, gelen: ${ids.join(',')}`);
  assert.equal(out.candidates[0].registryChanged, false);
  assert.equal(out.candidates[0].recommendedStatus, 'fixed-candidate');
});
check('classifyRunResult haritası', () => {
  assert.equal(classifyRunResult({ status: 'failed' }), 'reproduced');
  assert.equal(classifyRunResult({ status: 'passed' }), 'unexpected-pass');
  assert.equal(classifyRunResult({ status: 'skipped' }), 'inconclusive');
  assert.equal(classifyRunResult(undefined), 'infra-error');
});

// ── 11. Registry değişmezliği ─────────────────────────────────────────────────
check('reconcile registry\'yi değiştirmez (fingerprint sabit)', () => {
  const before = registryFingerprint(root);
  reconcile({ suites: [] }, KNOWN_BUGS, {});
  const after = registryFingerprint(root);
  assert.equal(before, after, 'registry parmak izi değişmemeli');
});
check('forensik araç kaynakları known-bugs.js\'e YAZMAZ (statik)', () => {
  const toolFiles = ['report-bug.mjs', 'reconcile-known-bugs.mjs', 'prepare-forensic-artifact.mjs', 'forensic-lib.mjs'];
  for (const f of toolFiles) {
    const src = readFileSync(join(root, 'tools', f), 'utf8');
    // known-bugs.js'e yazma deseni yasak (writeFileSync/appendFileSync + known-bugs)
    const writesRegistry = /(write|append)FileSync[^\n]*known-bugs/i.test(src) ||
      /known-bugs[^\n]*(write|append)FileSync/i.test(src);
    assert.ok(!writesRegistry, `${f} registry'ye yazıyor görünüyor`);
  }
});

// ── Temizlik + sonuç ──────────────────────────────────────────────────────────
rmSync(scratch, { recursive: true, force: true });

if (failures.length > 0) {
  console.error(`Forensik self-check BAŞARISIZ (${failures.length}):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  'Forensik self-check geçti: bilinmeyen-id, CLI/env uyuşmazlığı, forensik test.fail atlama, ' +
    'upload allowlist + JSON/PNG sanitizer kapısı, trace secret taraması, trace/video lokal-only, ' +
    'unexpected-pass→fixed-candidate, normal/permanent→üretmez, registry değişmezliği.'
);
