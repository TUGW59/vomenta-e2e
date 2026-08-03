#!/usr/bin/env node
// @ts-check
/**
 * READ-ONLY AUDIT WORKFLOW STATİK ENFORCEMENT — SERT KAPI (FAZ 3, ADR-0020).
 *
 * `.github/workflows/readonly-audit.yml` YAML'ını YAPISAL parse ederek (metin araması
 * değil) audit lane'inin handoff §FAZ3 sözleşmesine uyduğunu kanıtlar. YAML alt-küme
 * parser'ı WP-CI/WP-SEC-B ile aynıdır (tek gerçeklik kaynağı).
 *
 * Denetlenen kurallar:
 *   1) readonly-audit job mevcut.
 *   2) Tetikleyiciler: on.workflow_dispatch + on.schedule (manuel + planlı).
 *   3) profile input type=choice ve options == AUDIT_PROFILES (serbest argüman yok,
 *      enum drift yok — cross-browser/visual/staging profili audit'e giremez).
 *   4) Seçici adımı (select-readonly-tests / ci:readonly:select) var.
 *   5) assert-safe adımı (audit-ci assert-safe) var — mutation/external-cost=0 kapısı.
 *   6) plan adımı (audit-ci plan) var ve id taşır (outputs için).
 *   7) Orchestrator adımı (run-audit / ci:audit) var — GATING; continue-on-error yok, || true yok.
 *   8) Hiçbir adımda continue-on-error: true yok; hiçbir run'da || true yok.
 *   9) ALLOW_MUTATING_TESTS workflow/job/step düzeyinde true değil.
 *  10) Orchestrator'dan SONRA gelen adım continue-on-error:true ile job'ı yeşile zorlamıyor.
 *  11) permissions.contents: read (write yok — least privilege).
 *  12) job summary adımı (audit-ci summary) $GITHUB_STEP_SUMMARY'ye yazıyor.
 *  13) secure upload path'i test-results/secure-upload/readonly-audit/ (ham upload yok;
 *      allowlist self-check bunu ayrıca derinlemesine doğrular).
 *
 * Gerçek workflow 0 ihlalle geçmeli; sentetik bozuk snippet'lerle kapının düştüğü kanıtlanır.
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
const JOB = 'readonly-audit';
const SECURE_PATH = 'test-results/secure-upload/readonly-audit';

const RULES = Object.freeze({
  JOB_MISSING: 'AUDIT-WF-JOB-MISSING',
  TRIGGER: 'AUDIT-WF-TRIGGER',
  PROFILE_INPUT: 'AUDIT-WF-PROFILE-INPUT',
  SELECTOR: 'AUDIT-WF-SELECTOR',
  ASSERT_SAFE: 'AUDIT-WF-ASSERT-SAFE',
  PLAN: 'AUDIT-WF-PLAN',
  ORCHESTRATOR: 'AUDIT-WF-ORCHESTRATOR',
  NO_MASK: 'AUDIT-WF-NO-MASK',
  MUTATION_ENV: 'AUDIT-WF-MUTATION-ENV',
  GATE: 'AUDIT-WF-GATE',
  PERMISSIONS: 'AUDIT-WF-PERMISSIONS',
  SUMMARY: 'AUDIT-WF-SUMMARY',
  SECURE_UPLOAD: 'AUDIT-WF-SECURE-UPLOAD',
});

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
  const job = jobs[JOB];
  if (!job || typeof job !== 'object') {
    add(RULES.JOB_MISSING, `jobs.${JOB} yok`);
    return v; // job yoksa devamı anlamsız
  }
  const steps = Array.isArray(job.steps) ? job.steps : [];
  const runStrings = steps.filter((s) => s && typeof s.run === 'string').map((s) => s.run);
  const joinedRuns = runStrings.join('\n');
  const usesStrings = steps.filter((s) => s && typeof s.uses === 'string').map((s) => s.uses);

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

  // 4-7) Zorunlu adımlar (script veya doğrudan dosya).
  const hasSelector = /ci:readonly:select|select-readonly-tests\.mjs/.test(joinedRuns);
  const hasAssertSafe = /audit-ci\.mjs\s+assert-safe/.test(joinedRuns);
  const hasPlan = /audit-ci\.mjs\s+plan/.test(joinedRuns);
  const hasOrchestrator = /ci:audit|run-audit\.mjs/.test(joinedRuns);
  if (!hasSelector) add(RULES.SELECTOR, 'seçici adımı (select-readonly-tests) yok');
  if (!hasAssertSafe) add(RULES.ASSERT_SAFE, 'assert-safe adımı (audit-ci assert-safe) yok');
  if (!hasPlan) add(RULES.PLAN, 'plan adımı (audit-ci plan) yok');
  if (!hasOrchestrator) add(RULES.ORCHESTRATOR, 'orchestrator adımı (run-audit) yok');

  // plan adımı outputs için id taşımalı.
  const planStep = steps.find((s) => s && typeof s.run === 'string' && /audit-ci\.mjs\s+plan/.test(s.run));
  if (planStep && !planStep.id) add(RULES.PLAN, 'plan adımı id taşımıyor (outputs erişilemez)');

  // 8) continue-on-error / || true yok.
  const coeBad = steps.filter((s) => s && String(s['continue-on-error']).toLowerCase() === 'true');
  if (coeBad.length) add(RULES.NO_MASK, `${coeBad.length} adımda continue-on-error:true`);
  if (/\|\|\s*true\b/.test(joinedRuns)) add(RULES.NO_MASK, 'run komutunda || true var');

  // 9) ALLOW_MUTATING_TESTS true değil (workflow/job/step).
  const envTrue = (o) => o && typeof o === 'object' && String(o.ALLOW_MUTATING_TESTS) === 'true';
  const stepMutTrue = steps.some((s) => s && envTrue(s.env));
  if (envTrue(doc.env) || envTrue(job.env) || stepMutTrue) {
    add(RULES.MUTATION_ENV, 'ALLOW_MUTATING_TESTS=true (workflow/job/step)');
  }

  // 10) Orchestrator GATING: run-audit adımı maskesiz; SONRASINDA continue-on-error:true run yok.
  const orchIdx = steps.findIndex((s) => s && typeof s.run === 'string' && /ci:audit|run-audit\.mjs/.test(s.run));
  if (orchIdx >= 0) {
    const orch = steps[orchIdx];
    const gated =
      String(orch['continue-on-error']).toLowerCase() !== 'true' && !/\|\|\s*true\b/.test(orch.run);
    if (!gated) add(RULES.GATE, 'orchestrator adımı maskeli (continue-on-error/|| true)');
    const afterMask = steps
      .slice(orchIdx + 1)
      .some((s) => s && String(s['continue-on-error']).toLowerCase() === 'true' && typeof s.run === 'string');
    if (afterMask) add(RULES.GATE, 'orchestrator sonrası continue-on-error:true adım job\'ı yeşile zorluyor');
  }

  // 11) permissions.contents: read; write yok.
  const perms = doc.permissions;
  if (!perms || typeof perms !== 'object' || perms.contents !== 'read') {
    add(RULES.PERMISSIONS, `permissions.contents=${perms && perms.contents} (read olmalı)`);
  } else {
    for (const [k, val] of Object.entries(perms)) {
      if (String(val) === 'write') add(RULES.PERMISSIONS, `permissions.${k}=write (least-privilege ihlali)`);
    }
  }

  // 12) summary adımı $GITHUB_STEP_SUMMARY'ye yazıyor.
  const hasSummary = steps.some(
    (s) => s && typeof s.run === 'string' && /audit-ci\.mjs\s+summary/.test(s.run) && /GITHUB_STEP_SUMMARY/.test(s.run)
  );
  if (!hasSummary) add(RULES.SUMMARY, 'summary adımı ($GITHUB_STEP_SUMMARY) yok');

  // 13) secure upload path.
  const uploadStep = steps.find(
    (s) => s && typeof s.uses === 'string' && /actions\/upload-artifact@/.test(s.uses)
  );
  const rawPath = uploadStep && uploadStep.with && uploadStep.with.path;
  const paths = typeof rawPath === 'string' ? rawPath.split('\n').map((p) => p.trim()).filter(Boolean) : [];
  const secureOnly = paths.length > 0 && paths.every((p) => p.replace(/\/+$/, '') === SECURE_PATH);
  if (!uploadStep || !secureOnly) {
    add(RULES.SECURE_UPLOAD, `upload path secure lane değil: ${paths.join(',') || '(yok)'}`);
  }
  void usesStrings;
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
check('orchestrator || true → NO-MASK/GATE', () => {
  const res = scanAuditWorkflow(
    base.replace(
      'node tools/run-audit.mjs \\',
      'node tools/run-audit.mjs || true \\'
    )
  );
  assert.ok(
    res.some((x) => x.ruleId === RULES.NO_MASK || x.ruleId === RULES.GATE),
    `|| true reddedilmeli; gelen: ${res.map((x) => x.ruleId).join(',') || '(temiz)'}`
  );
});
check('permissions write → PERMISSIONS', () => {
  expectRule((t) => t.replace('  contents: read', '  contents: write'), RULES.PERMISSIONS, 'write perms');
});
check('job silinince → JOB-MISSING', () => {
  expectRule((t) => t.replace(/  readonly-audit:/, '  something-else:'), RULES.JOB_MISSING, 'no job');
});

if (failures.length > 0) {
  console.error(`Audit workflow enforcement BAŞARISIZ (${failures.length}):`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(
  `Audit workflow enforcement geçti: gerçek readonly-audit.yml 13 yapısal kurala uyuyor; ` +
    `6 sentetik negatif (trigger/enum/mutation-env/mask/permissions/job) reddedildi.`
);
