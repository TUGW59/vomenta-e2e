#!/usr/bin/env node
// @ts-check
/**
 * WP-R4 — Fixed-candidate doğrulama koşusu + toplayıcı (mekanizma).
 *
 *   npm run report:verify -- B4
 *
 * Tek bir BAĞIMSIZ doğrulama koşusu yapar (forensik modda, read-only), bir
 * "attestation" üretir, ardından o bulgunun TÜM attestation'larını eşiğe göre
 * birleştirip `verification-report.json` yazar.
 *
 * BAĞLAYICI (WP-R4 kararları): hiçbir finding KAPATILMAZ, registry DEĞİŞMEZ,
 * `knownBugGuard` kaldırılmaz, şema genişletilmez, otomatik PR/merge yapılmaz.
 * `verified-fixed-proposal` bile yalnız öneridir. Eşik: ≥3 bağımsız başarılı koşu,
 * ≥2 ayrı takvim günü; arada reproduce/infra-error/profil-uyuşmazlığı/retry-pass →
 * seri sıfırlanır. Tek unexpected-pass asla verified-fixed üretmez.
 *
 * "Bağımsız başarılı koşu" (attestation.qualifies): result=pass + ilk denemede pass +
 * retries=0 + profileVerified + taze session + production-readonly + ayrı workflowRunId +
 * registry fingerprint değişmemiş.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync, readdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import {
  resolveFinding,
  findingDir,
  escapeRegExp,
  registryFingerprint,
  flattenPlaywrightReport,
  classifyRunResult,
  normalizeProfile,
  profileMatches,
  aggregateVerification,
  prepareVerificationBundle,
  assessReadOnly,
} from './forensic-lib.mjs';
import { verificationProfileFor } from '../tests/contracts/verification-profiles.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fail = (m) => { console.error(`report:verify HATASI — ${m}`); process.exit(1); };

// ── 1. Argüman + registry çözümleme ───────────────────────────────────────────
const id = (process.argv[2] || '').trim();
if (!id) fail('bulgu id gerekli. Kullanım: npm run report:verify -- B4');
let finding;
try { finding = resolveFinding(id); } catch (e) { fail(e.message); }
if (process.env.ALLOW_MUTATING_TESTS === 'true') fail('doğrulama read-only çalışır; ALLOW_MUTATING_TESTS=true ile koşulamaz.');
if (/\.mutation\./.test(finding.test.file)) fail(`bulgu testi mutation spec'i (${finding.test.file}); doğrulama mutation koşmaz.`);

const cfg = verificationProfileFor(id);
const fingerprintBefore = registryFingerprint(root);

const dirRel = findingDir(id);
const dirAbs = resolve(root, dirRel);
const vDirAbs = join(dirAbs, 'verification');
const attDirAbs = join(vDirAbs, 'attestations');
mkdirSync(attDirAbs, { recursive: true });
// Bu koşunun forensik byproduct'ları (profile.json vb.) taze olsun; attestation GEÇMİŞİ korunur.
for (const f of ['profile.json', 'profile.SKIPPED.txt', 'network-summary.json', 'safe-final-state.png']) {
  rmSync(join(dirAbs, f), { force: true });
}

// ── 2. Bağımsız doğrulama koşusu (forensik mod + profil yakalama; retries=0) ────
const args = [
  'playwright', 'test', finding.test.file,
  '--project=chromium-authed',
  '--grep', escapeRegExp(finding.test.title),
  '--workers=1', '--retries=0', '--reporter=json',
];
console.log(`▶ doğrulama koşusu: ${id} → ${finding.test.title}`);
let stdout = '';
try {
  stdout = execFileSync('npx', args, {
    cwd: root, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024,
    env: { ...process.env, FORENSIC_BUG: id, VERIFY_PROFILE: '1', ALLOW_MUTATING_TESTS: 'false' },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
} catch (e) { stdout = e.stdout ? String(e.stdout) : ''; } // reproduce'da npx non-zero → beklenen

let report = null;
try { report = JSON.parse(stdout); } catch { report = null; }
const flat = report ? flattenPlaywrightReport(report) : [];
const target = flat.find((t) => t.title === finding.test.title) || flat[0];

// ── 3. Sonuç + profil doğrulama ───────────────────────────────────────────────
const runClass = classifyRunResult(target); // reproduced|unexpected-pass|inconclusive|infra-error
let result = runClass === 'unexpected-pass' ? 'pass' : runClass;
const firstAttemptPass = target?.firstStatus === 'passed';
const retries = target ? Math.max(0, (target.attempts || 1) - 1) : 0;

// Profil kısıtı varsa: profile.json'dan normalize et; yoksa/eşleşmezse profileVerified=false.
let profile = { constraint: Boolean(cfg) };
let profileVerified = !cfg; // kısıt yoksa profil-bağımsız (true)
if (cfg) {
  const pPath = join(dirAbs, 'profile.json');
  if (existsSync(pPath)) {
    try {
      const captured = JSON.parse(readFileSync(pPath, 'utf8'));
      const norm = normalizeProfile(captured.keys || [], { contractId: id, version: cfg.version });
      profileVerified = profileMatches(norm.permissions, cfg);
      profile = { constraint: true, fingerprint: norm.fingerprint, permissions: norm.permissions, matched: profileVerified };
      copyFileSync(pPath, join(vDirAbs, 'profile.json'));
    } catch (e) {
      profileVerified = false;
      profile = { constraint: true, error: `profile.json okunamadı: ${e.message}` };
    }
  } else {
    profileVerified = false;
    profile = { constraint: true, error: 'profil yakalanamadı (izin ucu görülmedi / yanıt okunamadı)' };
  }
}
// Kısıtlı bulguda profil doğrulanamazsa: pass bile olsa inconclusive (WP-R4 #7).
if (cfg && !profileVerified && result === 'pass') result = 'inconclusive';

// ── 3b. Salt-okunur ağ kanıtı (WP-R4 takip #2) ────────────────────────────────
// WP-R3 forensik recorder hedef testin page context'inde network-summary.json üretir
// (auth-setup ayrı context → dahil DEĞİL). Sanitize edilmiş (method+path+status+süre+tip).
// Mutation method görülürse: policy violation → başarılı sayılmaz + CI hard failure.
let readOnlyVerified = false;
let mutatingRequests = [];
const netPath = join(dirAbs, 'network-summary.json');
if (existsSync(netPath)) {
  try {
    const summary = JSON.parse(readFileSync(netPath, 'utf8'));
    const assessment = assessReadOnly(summary);
    readOnlyVerified = assessment.readOnly;
    mutatingRequests = assessment.mutating;
    copyFileSync(netPath, join(vDirAbs, 'network-summary.json'));
  } catch {
    readOnlyVerified = false;
  }
}
const policyViolation = mutatingRequests.length > 0;
// Mutation method → koşu başarılı kanıt sayılmasın (result pass ise inconclusive'e düşür).
if (policyViolation && result === 'pass') result = 'inconclusive';

// ── 4. Attestation ─────────────────────────────────────────────────────────────
const timestamp = new Date().toISOString();
const workflowRunId = process.env.GITHUB_RUN_ID || null;
const attestation = {
  findingId: id,
  test: finding.test,
  environment: 'production-readonly',
  result, // pass|reproduced|inconclusive|infra-error
  firstAttemptPass,
  retries,
  profile,
  profileVerified,
  readOnlyVerified,
  mutatingRequests,
  policyViolation,
  freshLogin: process.env.VERIFY_FRESH_SESSION === 'true', // taze login/storage state
  workflowRunId,
  timestamp,
  day: timestamp.slice(0, 10),
  commitSha: process.env.GITHUB_SHA || null, // yalnız metadata
  registryFingerprint: fingerprintBefore,
};
const attName = `attestation-${workflowRunId || `local-${Date.now()}`}.json`;
writeFileSync(join(attDirAbs, attName), JSON.stringify(attestation, null, 2) + '\n');

// ── 5. Toplama (tüm attestation'lar) → verification-report.json ────────────────
const attestations = readdirSync(attDirAbs)
  .filter((f) => f.startsWith('attestation-') && f.endsWith('.json'))
  .map((f) => { try { return JSON.parse(readFileSync(join(attDirAbs, f), 'utf8')); } catch { return null; } })
  .filter(Boolean);
const aggregate = aggregateVerification(id, attestations, {
  now: timestamp,
  expectedRegistryFingerprint: fingerprintBefore,
});
writeFileSync(join(vDirAbs, 'verification-report.json'), JSON.stringify(aggregate, null, 2) + '\n');

// ── 6. Registry değişmedi mi (defansif) ────────────────────────────────────────
if (registryFingerprint(root) !== fingerprintBefore) fail('registry parmak izi değişti — doğrulama registry\'yi ASLA değiştirmemeli.');

// ── 7. Güvenli upload bundle ────────────────────────────────────────────────────
const bundle = prepareVerificationBundle(vDirAbs);
if (bundle.rejected.length > 0) {
  console.error('Doğrulama artifact güvenlik kapısı REDDETTİ:');
  for (const r of bundle.rejected) console.error(`  ✗ ${r.name}: ${r.reason}`);
  fail('güvenli olmayan/beklenmeyen dosya; upload bundle üretilmedi.');
}

console.log(`✔ bu koşu: result=${attestation.result} · firstAttemptPass=${firstAttemptPass} · profileVerified=${profileVerified} · readOnlyVerified=${readOnlyVerified} · freshLogin=${attestation.freshLogin} · run=${workflowRunId || 'local'}`);
console.log(`✔ TOPLAM sonuç: ${aggregate.result} (seri: ${aggregate.streak.runs} run / ${aggregate.streak.days} gün, eşik ${aggregate.threshold.minRuns}/${aggregate.threshold.minDays})`);
console.log(`✔ rapor: ${join(dirRel, 'verification', 'verification-report.json')}`);
console.log(`✔ upload bundle: ${join(dirRel, 'verification', 'upload')}/ → ${bundle.copied.join(', ') || '(boş)'}`);
console.log('✔ registry değişmedi; hiçbir finding kapatılmadı (yalnız öneri).');

// ── 8. Policy gate: hedef testte mutation method → HARD FAILURE (güvenli bundle yazıldı) ──
if (policyViolation) {
  console.error(`✗ POLICY VIOLATION: hedef finding koşusunda mutation method(ları) görüldü: ${mutatingRequests.join(', ')}`);
  console.error('  Koşu başarılı sayılmadı; verified-fixed-proposal üretilemez. Bundle güvenli yazıldı; CI job hard failure.');
  process.exit(1);
}
