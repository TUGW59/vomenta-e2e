// @ts-check
/**
 * ROL-ENFORCEMENT LANE STATİK KAPISI — regression guard (CI orphan geri gelmesin).
 *
 * `.github/workflows/playwright.yml`'i YAPISAL parse ederek (metin araması değil)
 * rol-scoped enforcement spec'lerini gerçekten koşturan bir lane'in var olduğunu kanıtlar:
 *   1) `tools/run-role-enforcement.mjs`'i çağıran bir job VAR.
 *   2) O job schedule/dispatch ile koşar (PR-gate DEĞİL → required set'i kilitleyemez).
 *   3) O job'da continue-on-error:true ve `|| true` YOK (fail-closed).
 *   4) Koşucu `configuredRoles()` üzerinden DİNAMİK (tek rol hardcode edilmemiş) →
 *      credential eklenince ilgili rol otomatik kapsanır.
 *
 * Bu kapı olmadan rol-scoped spec'ler tekrar "hiçbir lane koşmuyor" orphan'ına düşebilir.
 *
 * Çalıştır:  node tools/self-check-role-enforcement-lane.mjs  (npm run quality:role-lane)
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseYamlSubset } from './yaml-subset.mjs';

const root = process.cwd();
const WF = path.join(root, '.github', 'workflows', 'playwright.yml');
const RUNNER = path.join(root, 'tools', 'run-role-enforcement.mjs');
const RUNNER_MARKER = 'run-role-enforcement.mjs';

/**
 * @param {any} doc parse edilmiş workflow
 * @param {string} runnerSrc koşucu kaynak metni
 * @returns {string[]} ihlaller (boş = OK)
 */
export function auditRoleLane(doc, runnerSrc) {
  const errs = [];
  const jobs = doc && typeof doc.jobs === 'object' ? doc.jobs : {};

  // 1) run-role-enforcement.mjs'i çağıran job'ı bul.
  /** @type {[string, any] | null} */
  let found = null;
  for (const [name, job] of Object.entries(jobs)) {
    const steps = job && Array.isArray(job.steps) ? job.steps : [];
    const runs = steps
      .filter((s) => s && typeof s === 'object' && typeof s.run === 'string')
      .map((s) => s.run)
      .join('\n');
    if (runs.includes(RUNNER_MARKER)) {
      found = [name, job];
      break;
    }
  }
  if (!found) {
    errs.push(`Hiçbir job "${RUNNER_MARKER}" çağırmıyor (rol-scoped spec'ler orphan).`);
    return errs; // sonraki kontroller job'a bağlı
  }

  const [jobName, job] = found;
  const steps = Array.isArray(job.steps) ? job.steps : [];
  const runs = steps
    .filter((s) => s && typeof s === 'object' && typeof s.run === 'string')
    .map((s) => s.run)
    .join('\n');

  // 2) schedule/dispatch ile koşmalı (PR-gate değil).
  const ifStr = typeof job.if === 'string' ? job.if : '';
  const onSchedOrDispatch = /schedule|workflow_dispatch/.test(ifStr);
  if (!onSchedOrDispatch) {
    errs.push(`${jobName}.if schedule/workflow_dispatch içermiyor: "${ifStr}" (nightly/dispatch lane olmalı).`);
  }

  // 3) fail-closed: continue-on-error:true ve `|| true` yok.
  const coeBad = steps.some(
    (s) => s && typeof s === 'object' && String(s['continue-on-error']).toLowerCase() === 'true'
  );
  if (coeBad) errs.push(`${jobName}: continue-on-error:true var (fail-closed ihlali).`);
  if (/\|\|\s*true\b/.test(runs)) errs.push(`${jobName}: runtime komutunda "|| true" var (fail-closed ihlali).`);

  // 4) Koşucu configuredRoles() üzerinden dinamik olmalı.
  if (!/configuredRoles\s*\(/.test(runnerSrc)) {
    errs.push('run-role-enforcement.mjs configuredRoles() kullanmıyor (dinamik kapsam yok; hardcode riski).');
  }

  return errs;
}

function selfTest() {
  const errs = [];
  const goodRunner = 'import { configuredRoles } from "../config/environment.js"; configuredRoles();';
  const goodDoc = {
    jobs: {
      'role-enforcement': {
        if: "github.event_name == 'schedule' || (github.event_name == 'workflow_dispatch')",
        steps: [{ run: 'node tools/run-role-enforcement.mjs' }],
      },
    },
  };
  if (auditRoleLane(goodDoc, goodRunner).length !== 0) errs.push('good case ihlal verdi');

  const missingDoc = { jobs: { other: { steps: [{ run: 'echo hi' }] } } };
  if (!auditRoleLane(missingDoc, goodRunner).some((e) => e.includes('orphan'))) errs.push('missing-job tespit edilmedi');

  const prDoc = {
    jobs: { 'role-enforcement': { if: 'pull_request', steps: [{ run: 'node tools/run-role-enforcement.mjs' }] } },
  };
  if (!auditRoleLane(prDoc, goodRunner).some((e) => e.includes('schedule/workflow_dispatch'))) errs.push('PR-gate tespit edilmedi');

  const coeDoc = {
    jobs: {
      'role-enforcement': {
        if: 'schedule',
        steps: [{ run: 'node tools/run-role-enforcement.mjs', 'continue-on-error': true }],
      },
    },
  };
  if (!auditRoleLane(coeDoc, goodRunner).some((e) => e.includes('continue-on-error'))) errs.push('continue-on-error tespit edilmedi');

  if (!auditRoleLane(goodDoc, 'const x = 1;').some((e) => e.includes('configuredRoles')))
    errs.push('dinamik-kapsam eksikliği tespit edilmedi');

  return errs;
}

function main() {
  const metaErrs = selfTest();
  if (metaErrs.length) {
    console.error('Rol-lane META-TEST BAŞARISIZ:\n  ' + metaErrs.join('\n  '));
    process.exit(1);
  }

  let doc, runnerSrc;
  try {
    doc = parseYamlSubset(readFileSync(WF, 'utf8'));
  } catch (e) {
    console.error(`Workflow parse edilemedi: ${WF}\n${e.message}`);
    process.exit(1);
  }
  try {
    runnerSrc = readFileSync(RUNNER, 'utf8');
  } catch {
    console.error(`Koşucu bulunamadı: ${RUNNER}`);
    process.exit(1);
  }

  const errs = auditRoleLane(doc, runnerSrc);
  if (errs.length) {
    console.error(`Rol-enforcement lane kapısı BAŞARISIZ (${errs.length}):\n  ` + errs.join('\n  '));
    process.exit(1);
  }
  console.log(
    'Rol-enforcement lane kapısı geçti: run-role-enforcement.mjs çağıran schedule/dispatch job VAR, ' +
      'fail-closed, configuredRoles() ile dinamik; 5 meta-test geçti.'
  );
}

main();
