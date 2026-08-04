#!/usr/bin/env node
// @ts-check
/**
 * AUDIT-CI YARDIMCILARI SELF-CHECK — SERT KAPI (FAZ 3, ADR-0020).
 *
 * tools/audit-ci.mjs saf fonksiyonlarını TAMAMEN SENTETİK doğrular (diske/prod'a
 * dokunmadan): assertSelectionSafe, assertSelectedEffectsReadOnly, deriveRunPlan,
 * renderJobSummary, AUDIT_PROFILES türetimi. Her negatif senaryo fail-closed olmalı;
 * job summary hiçbir koşulda secret/PII sızdırmamalı ("listed != selected != executed"
 * ilkesini korumalı).
 *
 * Çalıştır:  node tools/self-check-audit-ci.mjs  (npm run quality:audit-ci)
 */
import assert from 'node:assert/strict';
import { findSecrets } from '../tests/fixtures/sanitize.js';
import {
  AUDIT_PROFILES,
  SAFE_AUDIT_PROJECT,
  assertSelectionSafe,
  assertSelectedEffectsReadOnly,
  deriveRunPlan,
  renderJobSummary,
} from './audit-ci.mjs';

const failures = [];
const check = (label, fn) => {
  try {
    fn();
  } catch (e) {
    failures.push(`${label}: ${e.message}`);
  }
};
/** fn HATA fırlatmalı; mesajı `needle` içermeli. */
function expectThrow(fn, needle, label) {
  try {
    fn();
  } catch (e) {
    assert.ok(String(e.message).includes(needle), `${label}: mesaj "${needle}" içermeli, gelen: ${e.message}`);
    return;
  }
  throw new Error(`${label}: hata beklenirken FIRLATILMADI`);
}

const validSelection = Object.freeze({
  schemaVersion: 1,
  profile: 'route-baseline-chromium',
  description: 'Kayıtlı her rota için tek read-only açılış tabanı (Chromium).',
  projects: ['chromium-authed'],
  grep: '@route-baseline',
  environment: 'production',
  policyGated: false,
  selectedSpecFileCount: 1,
  selectedSpecFiles: ['tests/registered-routes-smoke.authed.spec.js'],
});
const clone = (over) => ({ ...JSON.parse(JSON.stringify(validSelection)), ...over });

const manifestOk = {
  entries: [
    { id: 'tests/registered-routes-smoke.authed.spec.js', pathPattern: 'tests/registered-routes-smoke.authed.spec.js', effect: 'read-only', environment: 'both' },
  ],
};

// ── AUDIT_PROFILES türetimi ──────────────────────────────────────────────────
check('AUDIT_PROFILES: Chromium read-only profiller, cross-browser/visual HARİÇ', () => {
  assert.ok(AUDIT_PROFILES.includes('route-baseline-chromium'), 'route-baseline olmalı');
  assert.ok(AUDIT_PROFILES.includes('readonly-full-chromium'), 'full olmalı');
  assert.ok(!AUDIT_PROFILES.includes('readonly-cross-browser'), 'cross-browser OLMAMALI (çok proje)');
  assert.ok(!AUDIT_PROFILES.includes('visual-readonly'), 'visual OLMAMALI (policy-gated)');
  assert.equal(SAFE_AUDIT_PROJECT, 'chromium-authed');
});

// ── assertSelectionSafe ──────────────────────────────────────────────────────
check('geçerli seçim → assertSelectionSafe geçer', () => {
  assert.equal(assertSelectionSafe(validSelection), true);
});
check('executed iddiası → reddedilir', () => {
  expectThrow(() => assertSelectionSafe(clone({ executed: 5 })), 'EXECUTED_CLAIM_FORBIDDEN', 'executed');
});
check('enum-dışı profil → reddedilir', () => {
  expectThrow(() => assertSelectionSafe(clone({ profile: 'readonly-cross-browser' })), 'AUDIT_PROFILE_NOT_ALLOWED', 'cross-browser');
});
check('environment staging → reddedilir', () => {
  expectThrow(() => assertSelectionSafe(clone({ environment: 'staging' })), 'AUDIT_ENV_NOT_PRODUCTION', 'staging');
});
check('çok proje / yanlış proje → reddedilir', () => {
  expectThrow(() => assertSelectionSafe(clone({ projects: ['chromium-authed', 'firefox-authed'] })), 'AUDIT_PROJECT_UNSAFE', 'multi');
  expectThrow(() => assertSelectionSafe(clone({ projects: ['firefox-authed'] })), 'AUDIT_PROJECT_UNSAFE', 'firefox');
});
check('0 seçim → reddedilir', () => {
  expectThrow(() => assertSelectionSafe(clone({ selectedSpecFiles: [], selectedSpecFileCount: 0 })), 'AUDIT_ZERO_SELECTION', 'zero');
});
check('count uyuşmazlığı → reddedilir', () => {
  expectThrow(() => assertSelectionSafe(clone({ selectedSpecFileCount: 9 })), 'AUDIT_COUNT_MISMATCH', 'count');
});
check('geçersiz spec yolu → reddedilir', () => {
  expectThrow(() => assertSelectionSafe(clone({ selectedSpecFiles: ['not-a-spec.txt'], selectedSpecFileCount: 1 })), 'AUDIT_BAD_SPEC_PATH', 'path');
});

// ── assertSelectedEffectsReadOnly (manifest tabanlı ikinci kapı) ──────────────
check('tüm seçim manifest effect=read-only → geçer', () => {
  assert.equal(assertSelectedEffectsReadOnly(validSelection, manifestOk), true);
});
check('mutation-adı ama lifecycle read-only spec → manifest effect ile GEÇER', () => {
  const sel = clone({ profile: 'readonly-full-chromium', grep: null, selectedSpecFiles: ['tests/mutation-orphans.authed.spec.js'], selectedSpecFileCount: 1 });
  const m = { entries: [{ pathPattern: 'tests/mutation-orphans.authed.spec.js', effect: 'read-only', environment: 'both' }] };
  assert.equal(assertSelectedEffectsReadOnly(sel, m), true); // dosya-adı sanısıyla YANLIŞ reddedilmez
});
check('manifest effect=mutation → NONREADONLY-LEAK', () => {
  const m = { entries: [{ pathPattern: 'tests/registered-routes-smoke.authed.spec.js', effect: 'mutation', environment: 'staging' }] };
  expectThrow(() => assertSelectedEffectsReadOnly(validSelection, m), 'AUDIT_NONREADONLY_LEAK', 'mutation effect');
});
check('manifest staging-only read-only → STAGING-ONLY-LEAK', () => {
  const m = { entries: [{ pathPattern: 'tests/registered-routes-smoke.authed.spec.js', effect: 'read-only', environment: 'staging' }] };
  expectThrow(() => assertSelectedEffectsReadOnly(validSelection, m), 'AUDIT_STAGING_ONLY_LEAK', 'staging');
});
check('seçilen spec manifestte yok → drift fail-closed', () => {
  expectThrow(() => assertSelectedEffectsReadOnly(validSelection, { entries: [] }), 'AUDIT_SPEC_NOT_IN_MANIFEST', 'drift');
});

// ── deriveRunPlan ────────────────────────────────────────────────────────────
check('deriveRunPlan → {project, grep}', () => {
  assert.deepEqual(deriveRunPlan(validSelection), { project: SAFE_AUDIT_PROJECT, grep: '@route-baseline' });
});
check('grep null → boş grep (tüm read-only)', () => {
  assert.deepEqual(deriveRunPlan(clone({ profile: 'readonly-full-chromium', grep: null })), { project: SAFE_AUDIT_PROJECT, grep: '' });
});
check('güvensiz grep (shell) → reddedilir', () => {
  expectThrow(() => deriveRunPlan(clone({ grep: '@x; rm -rf /' })), 'AUDIT_GREP_UNSAFE', 'injection');
});

// ── renderJobSummary ─────────────────────────────────────────────────────────
const manifestCounts = { totalSpecs: 119, productionSafeReadOnly: 83, mutationExcluded: 30, externalCostExcluded: 0, stagingRequired: 36 };
const findings = { total: 61, open: 60, bySeverity: { critical: 1, high: 9, medium: 44, low: 7 } };
const meta = { runId: '30800000000', commit: 'abcdef1234', event: 'schedule' };

check('summary: bundle var → executed sayıları + blocker YOK', () => {
  const bundle = { totals: { total: 55, passed: 55, failed: 0, skipped: 0, flaky: 0, timedOut: 0 } };
  const md = renderJobSummary({ selection: validSelection, bundle, manifestCounts, meta, findings, artifactName: 'readonly-audit-secure' });
  assert.ok(md.includes('Çalışan test (executed) | 55') || md.includes('| 55 |'), 'executed 55 görünmeli');
  assert.ok(!md.includes('RUN BLOCKER'), 'blocker olmamalı');
  assert.ok(md.includes('listed != selected != executed'), 'kapsam-hunisi ilkesi olmalı');
  assert.ok(md.includes('readonly-audit-secure'), 'artifact adı olmalı');
});
check('summary: bundle yok/sourceMissing → RUN BLOCKER dürüstçe', () => {
  const md = renderJobSummary({ selection: validSelection, bundle: null, manifestCounts, meta, findings, artifactName: 'readonly-audit-secure' });
  assert.ok(md.includes('RUN BLOCKER'), 'blocker görünmeli');
  const md2 = renderJobSummary({ selection: validSelection, bundle: { sourceMissing: true }, manifestCounts, meta, findings, artifactName: 'readonly-audit-secure' });
  assert.ok(md2.includes('RUN BLOCKER'), 'sourceMissing blocker olmalı');
});
check('summary: known findings + test-edilmeyen kapsam görünür', () => {
  const bundle = { totals: { total: 10, passed: 9, failed: 1, skipped: 0, flaky: 0, timedOut: 0 } };
  const md = renderJobSummary({ selection: validSelection, bundle, manifestCounts, meta, findings, artifactName: 'readonly-audit-secure' });
  assert.ok(md.includes('61'), 'bulgu toplamı');
  assert.ok(/critical 1/.test(md), 'severity dağılımı');
  assert.ok(md.includes('Staging gerektiren toplam: 36'), 'staging kapsamı');
  assert.ok(/kanıtlamaz/i.test(md), 'ne kanıtlamaz bölümü');
});
check('summary: secret/PII sızıntısı YOK (findSecrets=0)', () => {
  const bundle = { totals: { total: 5, passed: 5, failed: 0, skipped: 0, flaky: 0, timedOut: 0 } };
  const md = renderJobSummary({ selection: validSelection, bundle, manifestCounts, meta, findings, artifactName: 'readonly-audit-secure' });
  assert.equal(findSecrets(md).length, 0, 'job summary sızıntısız olmalı');
});

if (failures.length > 0) {
  console.error(`Audit-ci self-check BAŞARISIZ (${failures.length}):`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(
  'Audit-ci self-check geçti: AUDIT_PROFILES türetimi + assertSelectionSafe/assertSelectedEffectsReadOnly/' +
    'deriveRunPlan negatif matrisi + renderJobSummary (executed/blocker/known-findings/PII-safe) doğrulandı.'
);
