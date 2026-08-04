#!/usr/bin/env node
// @ts-check
/**
 * SHARDED READ-ONLY AUDIT WORKFLOW STATİK ENFORCEMENT — SERT KAPI (FAZ 3 ACCEPTANCE, ADR-0022).
 *
 * `.github/workflows/readonly-audit.yml` YAML'ını YAPISAL parse ederek (metin araması
 * değil) SHARDED audit lane'inin handoff §FAZ3 + kabul sözleşmesine uyduğunu kanıtlar.
 * YAML alt-küme parser'ı WP-CI/WP-SEC-B ile aynıdır (tek gerçeklik kaynağı).
 *
 * YAPI: iki job.
 *   - `readonly-audit` (matrix, 4 shard, max-parallel 3, fail-fast false): her parça
 *     read-only Chromium'un 1/N'ini koşar; selector + assert-safe + plan(id) + shard
 *     orchestrator (audit-shard-run) + prepared secure shard upload.
 *   - `readonly-audit-merge` (needs readonly-audit, if !cancelled): shard bundle'larını
 *     indirir, assert-safe re-guard, merge orchestrator (merge-audit-shards) + summary
 *     ($GITHUB_STEP_SUMMARY) + prepared secure merged upload.
 *
 * Denetlenen kurallar (0 ihlalle geçmeli; sentetik bozuk snippet'lerle kapının düştüğü kanıtlanır):
 *   1) Her iki job mevcut.
 *   2) Tetikleyiciler: on.workflow_dispatch + on.schedule.
 *   3) profile input type=choice ve options == AUDIT_PROFILES (enum drift yok).
 *   4) shard job: matrix.shard 4 eleman, max-parallel 3, fail-fast false.
 *   5) shard job: selector + assert-safe + plan(id) + shard orchestrator (audit-shard-run) adımları.
 *   6) merge job: needs=readonly-audit, if !cancelled, download-artifact, assert-safe,
 *      merge orchestrator (merge-audit-shards), summary($GITHUB_STEP_SUMMARY) adımları.
 *   7) Hiçbir adımda continue-on-error:true yok; hiçbir run'da || true yok.
 *   8) ALLOW_MUTATING_TESTS workflow/job/step düzeyinde true değil.
 *   9) İki orchestrator da GATING (maskesiz); sonrasında continue-on-error:true yok.
 *  10) permissions.contents: read (write yok — least privilege).
 *  11) Upload path'leri secure lane: shard→readonly-audit-shard, merge→readonly-audit-merged.
 *
 * Çalıştır:  node tools/self-check-audit-workflow.mjs  (npm run quality:audit-workflow)
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { parseYamlSubset } from './yaml-subset.mjs';
import { AUDIT_PROFILES } from './audit-ci.mjs';

const root = process.cwd();
const WF = path.join(root, '.github', 'workflows', 'readonly-audit.yml');
const SHARD_JOB = 'readonly-audit';
const MERGE_JOB = 'readonly-audit-merge';
const SHARD_SECURE = 'test-results/secure-upload/readonly-audit-shard';
const MERGE_SECURE = 'test-results/secure-upload/readonly-audit-merged';
const EXPECTED_SHARDS = 4;
const EXPECTED_MAX_PARALLEL = 3;

const RULES = Object.freeze({
  JOB_MISSING: 'AUDIT-WF-JOB-MISSING',
  MERGE_JOB_MISSING: 'AUDIT-WF-MERGE-JOB-MISSING',
  TRIGGER: 'AUDIT-WF-TRIGGER',
  PROFILE_INPUT: 'AUDIT-WF-PROFILE-INPUT',
  SHARD_MATRIX: 'AUDIT-WF-SHARD-MATRIX',
  SELECTOR: 'AUDIT-WF-SELECTOR',
  ASSERT_SAFE: 'AUDIT-WF-ASSERT-SAFE',
  PLAN: 'AUDIT-WF-PLAN',
  SHARD_ORCH: 'AUDIT-WF-SHARD-ORCHESTRATOR',
  MERGE_NEEDS: 'AUDIT-WF-MERGE-NEEDS',
  MERGE_DOWNLOAD: 'AUDIT-WF-MERGE-DOWNLOAD',
  MERGE_ORCH: 'AUDIT-WF-MERGE-ORCHESTRATOR',
  NO_MASK: 'AUDIT-WF-NO-MASK',
  MUTATION_ENV: 'AUDIT-WF-MUTATION-ENV',
  GATE: 'AUDIT-WF-GATE',
  PERMISSIONS: 'AUDIT-WF-PERMISSIONS',
  SUMMARY: 'AUDIT-WF-SUMMARY',
  SECURE_UPLOAD: 'AUDIT-WF-SECURE-UPLOAD',
});

const stepsOf = (job) => (job && Array.isArray(job.steps) ? job.steps : []);
const runsOf = (steps) => steps.filter((s) => s && typeof s.run === 'string').map((s) => s.run);
const envTrue = (o) => o && typeof o === 'object' && String(o.ALLOW_MUTATING_TESTS) === 'true';
const uploadStepOf = (steps) => steps.find((s) => s && typeof s.uses === 'string' && /actions\/upload-artifact@/.test(s.uses));
const securePathOnly = (uploadStep, expected) => {
  const rawPath = uploadStep && uploadStep.with && uploadStep.with.path;
  const paths = typeof rawPath === 'string' ? rawPath.split('\n').map((p) => p.trim()).filter(Boolean) : [];
  return paths.length > 0 && paths.every((p) => p.replace(/\/+$/, '') === expected);
};

/** Bir orchestrator run adımı maskesiz (continue-on-error/|| true yok) + sonrasında mask yok mu? */
function checkGating(steps, matchRe, add) {
  const idx = steps.findIndex((s) => s && typeof s.run === 'string' && matchRe.test(s.run));
  if (idx < 0) return;
  const orch = steps[idx];
  const gated = String(orch['continue-on-error']).toLowerCase() !== 'true' && !/\|\|\s*true\b/.test(orch.run);
  if (!gated) add(RULES.GATE, 'orchestrator adımı maskeli (continue-on-error/|| true)');
  const afterMask = steps
    .slice(idx + 1)
    .some((s) => s && String(s['continue-on-error']).toLowerCase() === 'true' && typeof s.run === 'string');
  if (afterMask) add(RULES.GATE, 'orchestrator sonrası continue-on-error:true adım job\'ı yeşile zorluyor');
}

/** @param {string} text @returns {{ruleId:string,detail:string}[]} */
export function scanAuditWorkflow(text) {
  const v = [];
  const add = (ruleId, detail) => v.push({ ruleId, detail });
  let doc;
  try {
    doc = parseYamlSubset(text);
  } catch (e) {
    add(RULES.JOB_MISSING, `parse hatası: ${e.message}`);
    return v;
  }
  const jobs = doc && typeof doc.jobs === 'object' ? doc.jobs : {};
  const shardJob = jobs[SHARD_JOB];
  const mergeJob = jobs[MERGE_JOB];
  if (!shardJob || typeof shardJob !== 'object') {
    add(RULES.JOB_MISSING, `jobs.${SHARD_JOB} yok`);
  }
  if (!mergeJob || typeof mergeJob !== 'object') {
    add(RULES.MERGE_JOB_MISSING, `jobs.${MERGE_JOB} yok`);
  }
  if (!shardJob && !mergeJob) return v; // devamı anlamsız

  // 2) Tetikleyiciler.
  const on = doc.on || doc.true; // 'on' bazı parserlarda boolean anahtara düşebilir
  const hasDispatch = !!(on && typeof on === 'object' && 'workflow_dispatch' in on);
  const hasSchedule = !!(on && typeof on === 'object' && 'schedule' in on);
  if (!hasDispatch) add(RULES.TRIGGER, 'on.workflow_dispatch yok');
  if (!hasSchedule) add(RULES.TRIGGER, 'on.schedule yok');

  // 3) profile input: type=choice + options == AUDIT_PROFILES.
  const input = on && on.workflow_dispatch && on.workflow_dispatch.inputs && on.workflow_dispatch.inputs.profile;
  if (!input || typeof input !== 'object') {
    add(RULES.PROFILE_INPUT, 'workflow_dispatch.inputs.profile yok');
  } else {
    if (input.type !== 'choice') add(RULES.PROFILE_INPUT, `type=${input.type} (choice olmalı)`);
    const opts = Array.isArray(input.options) ? input.options.map(String) : null;
    if (!opts) add(RULES.PROFILE_INPUT, 'options listesi yok (serbest argüman yasak)');
    else {
      const want = [...AUDIT_PROFILES].sort();
      const got = [...opts].sort();
      const same = want.length === got.length && want.every((x, i) => x === got[i]);
      if (!same) add(RULES.PROFILE_INPUT, `options AUDIT_PROFILES ile eşleşmiyor: ${got.join(',')} != ${want.join(',')}`);
    }
  }

  // 9) Global env: ALLOW_MUTATING_TESTS true değil (workflow düzeyi).
  const allSteps = [...stepsOf(shardJob), ...stepsOf(mergeJob)];
  if (envTrue(doc.env) || envTrue(shardJob && shardJob.env) || envTrue(mergeJob && mergeJob.env) || allSteps.some((s) => s && envTrue(s.env))) {
    add(RULES.MUTATION_ENV, 'ALLOW_MUTATING_TESTS=true (workflow/job/step)');
  }
  // 7) continue-on-error / || true yok (her iki job).
  const coeBad = allSteps.filter((s) => s && String(s['continue-on-error']).toLowerCase() === 'true');
  if (coeBad.length) add(RULES.NO_MASK, `${coeBad.length} adımda continue-on-error:true`);
  if (/\|\|\s*true\b/.test(runsOf(allSteps).join('\n'))) add(RULES.NO_MASK, 'run komutunda || true var');

  // 10) permissions.contents read; write yok.
  const perms = doc.permissions;
  if (!perms || typeof perms !== 'object' || perms.contents !== 'read') {
    add(RULES.PERMISSIONS, `permissions.contents=${perms && perms.contents} (read olmalı)`);
  } else {
    for (const [k, val] of Object.entries(perms)) {
      if (String(val) === 'write') add(RULES.PERMISSIONS, `permissions.${k}=write (least-privilege ihlali)`);
    }
  }

  // ── 4-5) SHARD job ──
  if (shardJob) {
    const steps = stepsOf(shardJob);
    const joined = runsOf(steps).join('\n');

    // matrix: 4 shard, max-parallel 3, fail-fast false.
    const strategy = shardJob.strategy && typeof shardJob.strategy === 'object' ? shardJob.strategy : null;
    const matrix = strategy && strategy.matrix && typeof strategy.matrix === 'object' ? strategy.matrix : null;
    const shardVal = matrix ? matrix.shard : undefined;
    const shardCount = Array.isArray(shardVal)
      ? shardVal.length
      : typeof shardVal === 'string'
      ? (shardVal.match(/\d+/g) || []).length
      : 0;
    if (shardCount !== EXPECTED_SHARDS) add(RULES.SHARD_MATRIX, `matrix.shard ${shardCount} eleman (beklenen ${EXPECTED_SHARDS})`);
    if (!strategy || Number(strategy['max-parallel']) !== EXPECTED_MAX_PARALLEL) {
      add(RULES.SHARD_MATRIX, `max-parallel=${strategy && strategy['max-parallel']} (beklenen ${EXPECTED_MAX_PARALLEL})`);
    }
    if (!strategy || String(strategy['fail-fast']).toLowerCase() !== 'false') {
      add(RULES.SHARD_MATRIX, `fail-fast=${strategy && strategy['fail-fast']} (false olmalı; parçalar birbirini iptal etmesin)`);
    }

    if (!/ci:readonly:select|select-readonly-tests\.mjs/.test(joined)) add(RULES.SELECTOR, 'seçici adımı yok');
    if (!/audit-ci\.mjs\s+assert-safe/.test(joined)) add(RULES.ASSERT_SAFE, 'assert-safe adımı yok (shard)');
    if (!/audit-ci\.mjs\s+plan/.test(joined)) add(RULES.PLAN, 'plan adımı yok');
    const planStep = steps.find((s) => s && typeof s.run === 'string' && /audit-ci\.mjs\s+plan/.test(s.run));
    if (planStep && !planStep.id) add(RULES.PLAN, 'plan adımı id taşımıyor (outputs erişilemez)');
    if (!/audit-shard-run\.mjs/.test(joined)) add(RULES.SHARD_ORCH, 'shard orchestrator (audit-shard-run) adımı yok');
    checkGating(steps, /audit-shard-run\.mjs/, add);

    const up = uploadStepOf(steps);
    if (!up || !securePathOnly(up, SHARD_SECURE)) add(RULES.SECURE_UPLOAD, `shard upload path secure lane değil (beklenen ${SHARD_SECURE})`);
  }

  // ── 6) MERGE job ──
  if (mergeJob) {
    const steps = stepsOf(mergeJob);
    const joined = runsOf(steps).join('\n');

    const needs = mergeJob.needs;
    const needsOk = needs === SHARD_JOB || (Array.isArray(needs) && needs.includes(SHARD_JOB));
    if (!needsOk) add(RULES.MERGE_NEEDS, `merge job needs=${JSON.stringify(needs)} (readonly-audit olmalı)`);
    if (!(typeof mergeJob.if === 'string' && /!cancelled\(\)/.test(mergeJob.if))) {
      add(RULES.MERGE_NEEDS, `merge job if=${mergeJob.if} (!cancelled() olmalı — shard kırmızıysa da birleşik rapor)`);
    }
    if (!steps.some((s) => s && typeof s.uses === 'string' && /actions\/download-artifact@/.test(s.uses))) {
      add(RULES.MERGE_DOWNLOAD, 'download-artifact adımı yok (shard bundle indirilmeli)');
    }
    if (!/audit-ci\.mjs\s+assert-safe/.test(joined)) add(RULES.ASSERT_SAFE, 'assert-safe re-guard adımı yok (merge)');
    if (!/merge-audit-shards\.mjs/.test(joined)) add(RULES.MERGE_ORCH, 'merge orchestrator (merge-audit-shards) adımı yok');
    checkGating(steps, /merge-audit-shards\.mjs/, add);

    const hasSummary = steps.some(
      (s) => s && typeof s.run === 'string' && /audit-ci\.mjs\s+summary/.test(s.run) && /GITHUB_STEP_SUMMARY/.test(s.run)
    );
    if (!hasSummary) add(RULES.SUMMARY, 'summary adımı ($GITHUB_STEP_SUMMARY) yok (merge)');

    const up = uploadStepOf(steps);
    if (!up || !securePathOnly(up, MERGE_SECURE)) add(RULES.SECURE_UPLOAD, `merge upload path secure lane değil (beklenen ${MERGE_SECURE})`);
  }

  return v;
}

// ─────────────────────────── Sonuç + sentetik negatifler ───────────────────────────
const failures = [];
const check = (label, fn) => {
  try {
    fn();
  } catch (e) {
    failures.push(`${label}: ${e.message}`);
  }
};

// A) Gerçek workflow 0 ihlalle geçmeli.
check('gerçek readonly-audit.yml → 0 ihlal', () => {
  assert.ok(existsSync(WF), `${WF} yok`);
  const res = scanAuditWorkflow(readFileSync(WF, 'utf8'));
  assert.deepEqual(res, [], `ihlaller: ${res.map((x) => `${x.ruleId}(${x.detail})`).join(' | ')}`);
});

// B) Sentetik bozuk snippet'ler REDDEDİLMELİ (kapının bittiğini kanıtla).
const base = existsSync(WF) ? readFileSync(WF, 'utf8') : '';
function expectRule(mutator, ruleId, label) {
  const res = scanAuditWorkflow(mutator(base));
  assert.ok(
    res.some((x) => x.ruleId === ruleId),
    `${label}: ${ruleId} bekleniyordu; gelen: ${res.map((x) => x.ruleId).join(',') || '(temiz)'}`
  );
}

check('schedule silinince → TRIGGER', () => {
  expectRule((t) => t.replace(/  schedule:\n(?:.*\n)*?    - cron:.*\n/, ''), RULES.TRIGGER, 'no schedule');
});
check('enum-dışı profil option → PROFILE-INPUT', () => {
  expectRule((t) => t.replace('          - a11y-readonly', '          - readonly-cross-browser'), RULES.PROFILE_INPUT, 'bad option');
});
check('ALLOW_MUTATING_TESTS true → MUTATION-ENV', () => {
  expectRule((t) => t.replace("ALLOW_MUTATING_TESTS: 'false'", "ALLOW_MUTATING_TESTS: 'true'"), RULES.MUTATION_ENV, 'mutation env');
});
check('shard orchestrator || true → NO-MASK/GATE', () => {
  const res = scanAuditWorkflow(base.replace('node tools/audit-shard-run.mjs \\', 'node tools/audit-shard-run.mjs || true \\'));
  assert.ok(
    res.some((x) => x.ruleId === RULES.NO_MASK || x.ruleId === RULES.GATE),
    `|| true reddedilmeli; gelen: ${res.map((x) => x.ruleId).join(',') || '(temiz)'}`
  );
});
check('merge orchestrator || true → NO-MASK/GATE', () => {
  const res = scanAuditWorkflow(base.replace('node tools/merge-audit-shards.mjs \\', 'node tools/merge-audit-shards.mjs || true \\'));
  assert.ok(
    res.some((x) => x.ruleId === RULES.NO_MASK || x.ruleId === RULES.GATE),
    `|| true reddedilmeli; gelen: ${res.map((x) => x.ruleId).join(',') || '(temiz)'}`
  );
});
check('permissions write → PERMISSIONS', () => {
  expectRule((t) => t.replace('  contents: read', '  contents: write'), RULES.PERMISSIONS, 'write perms');
});
check('shard job silinince → JOB-MISSING', () => {
  expectRule((t) => t.replace(/\n  readonly-audit:\n/, '\n  something-else:\n'), RULES.JOB_MISSING, 'no shard job');
});
check('merge job silinince → MERGE-JOB-MISSING', () => {
  expectRule((t) => t.replace(/\n  readonly-audit-merge:\n/, '\n  something-merge-else:\n'), RULES.MERGE_JOB_MISSING, 'no merge job');
});
check('matrix 4≠3 shard → SHARD-MATRIX', () => {
  expectRule((t) => t.replace('shard: [1, 2, 3, 4]', 'shard: [1, 2, 3]'), RULES.SHARD_MATRIX, '3 shards');
});
check('max-parallel değişince → SHARD-MATRIX', () => {
  expectRule((t) => t.replace('max-parallel: 3', 'max-parallel: 4'), RULES.SHARD_MATRIX, 'mp4');
});
check('merge needs silinince → MERGE-NEEDS', () => {
  expectRule((t) => t.replace('    needs: readonly-audit\n', ''), RULES.MERGE_NEEDS, 'no needs');
});

if (failures.length > 0) {
  console.error(`Sharded audit workflow enforcement BAŞARISIZ (${failures.length}):`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(
  'Sharded audit workflow enforcement geçti: readonly-audit.yml iki-job (shard matrix 4×/max-parallel 3 + ' +
    'merge) yapısal kurallara uyuyor; 11 sentetik negatif (trigger/enum/mutation-env/shard-mask/merge-mask/' +
    'permissions/shard-job/merge-job/shard-matrix/max-parallel/merge-needs) reddedildi.'
);
