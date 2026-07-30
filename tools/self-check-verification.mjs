#!/usr/bin/env node
// @ts-check
/**
 * WP-R4 — Fixed-candidate doğrulama negatif self-check (kaçışsız kapı).
 *
 * Doğrulama mekanizmasının BAĞLAYICI kurallarını her koşuda kanıtlar. Hiçbiri
 * canlı koşu gerektirmez (sentetik attestation'lar). Registry ASLA değişmez.
 *
 * Kapsanan zorunlu senaryolar:
 *  1. 1 veya 2 pass → verified-fixed-proposal ÜRETMEZ
 *  2. 3 pass ama aynı run/session → üretmez (distinct workflowRunId)
 *  3. 3 pass ama tek gün → üretmez (distinct day)
 *  4. retry-pass → sayılmaz (seri kırılır)
 *  5. rol/izin profili uyuşmazlığı → inconclusive
 *  6. arada reproduce → seri sıfırlanır
 *  7. infra-error → pass sayılmaz
 *  8. bilinmeyen finding ID → hard failure
 *  9. registry fingerprint değişirse nitelik DÜŞER (+ CLI hard-fail statik)
 * 10. otomasyon registry'ye yazamaz (statik kaynak taraması)
 * 11. allowlist dışı artifact yüklenemez
 * 12. secret/PII seed'i güvenlik kapısını kırar
 *  +  POZİTİF: 3 bağımsız pass, ≥2 gün, profil-doğrulanmış → verified-fixed-proposal
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import {
  resolveFinding,
  normalizeProfile,
  profileMatches,
  qualifiesAsSuccess,
  aggregateVerification,
  prepareVerificationBundle,
  VERIFICATION_UPLOAD_ALLOWLIST,
  VERIFY_MIN_RUNS,
  VERIFY_MIN_DAYS,
} from './forensic-lib.mjs';
import { verificationProfileFor } from '../tests/contracts/verification-profiles.js';
import { findSecrets } from '../tests/fixtures/sanitize.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (label, fn) => { try { fn(); } catch (e) { failures.push(`${label}: ${e.message}`); } };

const FP = 'sha256:expected-registry-fingerprint';
const SEED_JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJVadQssw5c';
const OPTS = { now: '2026-08-01T00:00:00.000Z', expectedRegistryFingerprint: FP };

/** Nitelikli başarılı bir attestation iskeleti; over ile tek eksen bozulur. */
function att(over = {}) {
  return {
    findingId: 'B4',
    test: { file: 'tests/known-bugs.authed.spec.js', title: 'B4 · x' },
    environment: 'production-readonly',
    result: 'pass',
    firstAttemptPass: true,
    retries: 0,
    profile: { constraint: false },
    profileVerified: true,
    freshLogin: true,
    workflowRunId: 'run-1',
    timestamp: '2026-07-30T10:00:00.000Z',
    day: '2026-07-30',
    commitSha: null,
    registryFingerprint: FP,
    ...over,
  };
}
const stateOf = (atts) => aggregateVerification('B4', atts, OPTS).result;

// ── POZİTİF: 3 bağımsız pass, 2 gün, profil-doğrulanmış → verified-fixed-proposal ──
check('POZİTİF: 3 bağımsız pass + 2 gün → verified-fixed-proposal', () => {
  const atts = [
    att({ workflowRunId: 'r1', day: '2026-07-30', timestamp: '2026-07-30T10:00:00Z' }),
    att({ workflowRunId: 'r2', day: '2026-07-30', timestamp: '2026-07-30T20:00:00Z' }),
    att({ workflowRunId: 'r3', day: '2026-07-31', timestamp: '2026-07-31T10:00:00Z' }),
  ];
  assert.equal(stateOf(atts), 'verified-fixed-proposal');
});

// 1. 1 veya 2 pass → üretmez
check('1 pass → insufficient-evidence', () => {
  assert.equal(stateOf([att({ workflowRunId: 'r1' })]), 'insufficient-evidence');
});
check('2 pass → insufficient-evidence', () => {
  assert.equal(stateOf([att({ workflowRunId: 'r1', day: '2026-07-30' }), att({ workflowRunId: 'r2', day: '2026-07-31', timestamp: '2026-07-31T10:00:00Z' })]), 'insufficient-evidence');
});

// 2. 3 pass ama aynı run → üretmez
check('3 pass ama aynı workflowRunId → insufficient-evidence', () => {
  const atts = [
    att({ workflowRunId: 'SAME', day: '2026-07-30', timestamp: '2026-07-30T10:00:00Z' }),
    att({ workflowRunId: 'SAME', day: '2026-07-31', timestamp: '2026-07-31T10:00:00Z' }),
    att({ workflowRunId: 'SAME', day: '2026-08-01', timestamp: '2026-08-01T10:00:00Z' }),
  ];
  assert.equal(stateOf(atts), 'insufficient-evidence');
});

// 3. 3 pass ama tek gün → üretmez
check('3 pass ama tek gün → insufficient-evidence', () => {
  const atts = [
    att({ workflowRunId: 'r1', day: '2026-07-30', timestamp: '2026-07-30T10:00:00Z' }),
    att({ workflowRunId: 'r2', day: '2026-07-30', timestamp: '2026-07-30T14:00:00Z' }),
    att({ workflowRunId: 'r3', day: '2026-07-30', timestamp: '2026-07-30T18:00:00Z' }),
  ];
  assert.equal(stateOf(atts), 'insufficient-evidence');
});

// 4. retry-pass sayılmaz (seri kırılır)
check('retry-pass (firstAttemptPass=false) nitelik DÜŞER', () => {
  assert.equal(qualifiesAsSuccess(att({ firstAttemptPass: false }), FP), false);
  assert.equal(qualifiesAsSuccess(att({ retries: 1 }), FP), false);
  // 2 temiz pass + en son retry-pass → seri sıfırlanır → proposal DEĞİL
  const atts = [
    att({ workflowRunId: 'r1', day: '2026-07-30', timestamp: '2026-07-30T10:00:00Z' }),
    att({ workflowRunId: 'r2', day: '2026-07-31', timestamp: '2026-07-31T10:00:00Z' }),
    att({ workflowRunId: 'r3', day: '2026-08-01', timestamp: '2026-08-01T10:00:00Z', firstAttemptPass: false, retries: 1 }),
  ];
  assert.notEqual(stateOf(atts), 'verified-fixed-proposal');
});

// 5. profil uyuşmazlığı → inconclusive
check('profileVerified=false (son koşu) → inconclusive', () => {
  const atts = [
    att({ workflowRunId: 'r1', day: '2026-07-30', timestamp: '2026-07-30T10:00:00Z' }),
    att({ workflowRunId: 'r2', day: '2026-07-31', timestamp: '2026-07-31T10:00:00Z' }),
    att({ workflowRunId: 'r3', day: '2026-08-01', timestamp: '2026-08-01T10:00:00Z', profileVerified: false }),
  ];
  assert.equal(stateOf(atts), 'inconclusive');
});

// 6. arada reproduce → seri sıfırlanır
check('en son reproduce → reproduced (seri sıfır)', () => {
  const atts = [
    att({ workflowRunId: 'r1', day: '2026-07-30', timestamp: '2026-07-30T10:00:00Z' }),
    att({ workflowRunId: 'r2', day: '2026-07-31', timestamp: '2026-07-31T10:00:00Z' }),
    att({ workflowRunId: 'r3', day: '2026-08-01', timestamp: '2026-08-01T10:00:00Z' }),
    att({ workflowRunId: 'r4', day: '2026-08-02', timestamp: '2026-08-02T10:00:00Z', result: 'reproduced' }),
  ];
  assert.equal(stateOf(atts), 'reproduced');
});
check('ortada reproduce sonrası kısa seri → insufficient (proposal değil)', () => {
  const atts = [
    att({ workflowRunId: 'r1', day: '2026-07-30', timestamp: '2026-07-30T10:00:00Z' }),
    att({ workflowRunId: 'r2', day: '2026-07-31', timestamp: '2026-07-31T10:00:00Z' }),
    att({ workflowRunId: 'r3', day: '2026-07-31', timestamp: '2026-07-31T12:00:00Z', result: 'reproduced' }),
    att({ workflowRunId: 'r4', day: '2026-08-01', timestamp: '2026-08-01T10:00:00Z' }),
  ];
  assert.equal(stateOf(atts), 'insufficient-evidence');
});

// 7. infra-error → pass sayılmaz
check('en son infra-error → infra-error; nitelik DÜŞER', () => {
  assert.equal(qualifiesAsSuccess(att({ result: 'infra-error' }), FP), false);
  const atts = [
    att({ workflowRunId: 'r1', day: '2026-07-30', timestamp: '2026-07-30T10:00:00Z' }),
    att({ workflowRunId: 'r2', day: '2026-07-31', timestamp: '2026-07-31T10:00:00Z' }),
    att({ workflowRunId: 'r3', day: '2026-08-01', timestamp: '2026-08-01T10:00:00Z', result: 'infra-error' }),
  ];
  assert.equal(stateOf(atts), 'infra-error');
});

// 8. bilinmeyen finding ID → hard failure
check('bilinmeyen finding ID → resolveFinding hata', () => {
  assert.throws(() => resolveFinding('NO-SUCH-BUG'), /Bilinmeyen bulgu/);
  assert.ok(resolveFinding('B4').id === 'B4');
});

// 9. registry fingerprint uyuşmazlığı → nitelik DÜŞER
check('registryFingerprint farklı → qualifiesAsSuccess false', () => {
  assert.equal(qualifiesAsSuccess(att({ registryFingerprint: 'sha256:BASKA' }), FP), false);
  assert.equal(qualifiesAsSuccess(att(), FP), true);
});
check('session taze değil / env yanlış → nitelik DÜŞER', () => {
  assert.equal(qualifiesAsSuccess(att({ freshLogin: false }), FP), false);
  assert.equal(qualifiesAsSuccess(att({ environment: 'staging' }), FP), false);
  assert.equal(qualifiesAsSuccess(att({ workflowRunId: '' }), FP), false);
});

// Üretilen attestation + rapor sanitizer'a TAKILMAMALI (alan adları secret-kv deseniyle çakışmasın)
check('attestation + aggregate JSON findSecrets=[] (alan-adı regresyonu)', () => {
  const a = att({ profile: { constraint: true, fingerprint: 'sha256:abc', permissions: ['settings.view', 'modules.read'], matched: true } });
  assert.deepEqual(findSecrets(JSON.stringify(a)), [], `attestation sanitizer'a takıldı: ${findSecrets(JSON.stringify(a))}`);
  const agg = aggregateVerification('B4', [a], OPTS);
  assert.deepEqual(findSecrets(JSON.stringify(agg)), [], `aggregate sanitizer'a takıldı: ${findSecrets(JSON.stringify(agg))}`);
});

// Profil normalize + eşleşme (B4 örneği)
check('normalizeProfile secret/non-scope eler, sıralar, fingerprint üretir', () => {
  const n = normalizeProfile(['settings.view', 'settings.view', 'Bad Value!', SEED_JWT, 'a@b.com', 'modules.read']);
  assert.deepEqual(n.permissions, ['modules.read', 'settings.view']);
  assert.ok(n.fingerprint.startsWith('sha256:'));
});
check('B4 profil eşleşmesi: yasak izin varsa uyuşmaz, yoksa uyuşur', () => {
  const cfg = verificationProfileFor('B4');
  assert.ok(cfg && cfg.forbid.includes('settings.billing.view'));
  assert.equal(profileMatches(['contacts.view', 'reports.view'], cfg), true); // yetkisiz bağlam → doğru
  assert.equal(profileMatches(['settings.billing.view'], cfg), false); // yetkili → orijinal bağlam DEĞİL
});

// 10-11-12. Güvenlik kapısı (prepareVerificationBundle)
const scratch = resolve(root, 'test-results', '.verify-selfcheck');
rmSync(scratch, { recursive: true, force: true });
mkdirSync(scratch, { recursive: true });
function makeVDir(name, files) {
  const dir = join(scratch, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'attestations'), { recursive: true });
  for (const [f, c] of Object.entries(files)) {
    const full = join(dir, f);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, c);
  }
  return dir;
}
check('temiz doğrulama bundle: report+profile+attestations kopyalanır', () => {
  const dir = makeVDir('clean', {
    'verification-report.json': '{"result":"insufficient-evidence"}',
    'profile.json': '{"keys":["settings.view"]}',
    'attestations/attestation-r1.json': '{"result":"pass"}',
  });
  const b = prepareVerificationBundle(dir);
  assert.deepEqual(b.rejected, [], `beklenmeyen ret: ${JSON.stringify(b.rejected)}`);
  assert.ok(b.copied.includes('verification-report.json') && b.copied.includes('profile.json') && b.copied.includes('attestations/attestation-r1.json'));
});
check('allowlist dışı dosya REDDEDİLİR', () => {
  const dir = makeVDir('stray', {
    'verification-report.json': '{"result":"candidate"}',
    'network-summary.json': '{"total":0}', // WP-R4 doğrulama bundle\'ında değil
  });
  const b = prepareVerificationBundle(dir);
  assert.ok(b.rejected.some((r) => r.name === 'network-summary.json'));
});
check('secret/PII seed\'li JSON güvenlik kapısını kırar', () => {
  const dir = makeVDir('leaky', {
    'verification-report.json': `{"note":"jwt ${SEED_JWT}"}`,
  });
  const b = prepareVerificationBundle(dir);
  assert.ok(b.rejected.some((r) => r.name === 'verification-report.json'));
  const dir2 = makeVDir('leaky-att', { 'verification-report.json': '{}', 'attestations/attestation-x.json': `{"t":"Bearer ${SEED_JWT}"}` });
  const b2 = prepareVerificationBundle(dir2);
  assert.ok(b2.rejected.some((r) => r.name === 'attestations/attestation-x.json'));
});
check('allowlist video/ham içermez', () => {
  assert.ok(!VERIFICATION_UPLOAD_ALLOWLIST.some((n) => /\.(webm|mp4|zip)$/i.test(n)));
});

// 10. otomasyon registry'ye YAZMAZ (statik)
check('WP-R4 araçları known-bugs.js\'e YAZMAZ (statik)', () => {
  for (const f of ['verify-fixed-candidate.mjs', 'forensic-lib.mjs']) {
    const src = readFileSync(join(root, 'tools', f), 'utf8');
    const writes = /(write|append)FileSync[^\n]*known-bugs/i.test(src) || /known-bugs[^\n]*(write|append)FileSync/i.test(src);
    assert.ok(!writes, `${f} registry'ye yazıyor görünüyor`);
  }
  const cli = readFileSync(join(root, 'tools', 'verify-fixed-candidate.mjs'), 'utf8');
  assert.ok(/registryFingerprint\(root\) !== fingerprintBefore/.test(cli), 'CLI registry fingerprint değişimini kontrol etmeli');
});

// eşik sabitleri
check('eşik sabitleri 3 run / 2 gün', () => {
  assert.equal(VERIFY_MIN_RUNS, 3);
  assert.equal(VERIFY_MIN_DAYS, 2);
});

rmSync(scratch, { recursive: true, force: true });
if (failures.length) {
  console.error(`Doğrulama self-check BAŞARISIZ (${failures.length}):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  'Doğrulama self-check geçti: 1-2 pass / aynı-run / tek-gün / retry-pass / profil-uyuşmazlık / ' +
    'reproduce-reset / infra-error verified-fixed-proposal ÜRETMEZ; bilinmeyen-id + fingerprint + session ' +
    'nitelik kapıları; allowlist + secret kapısı; registry değişmezliği. Pozitif yol (3 run/2 gün) doğrulandı.'
);
