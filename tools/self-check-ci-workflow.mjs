// @ts-check
/**
 * PR-IMPACT WORKFLOW STATİK ENFORCEMENT — SERT KAPI (WP-CI-E2 / Faz 2).
 *
 * `.github/workflows/playwright.yml` YAML'ını YAPISAL parse ederek (metin araması
 * değil) `pr-impact` job'ının handoff §2.7 sözleşmesine uyduğunu kanıtlar. YAML
 * alt-küme parser'ı WP-SEC-B'den yeniden kullanılır (tek gerçeklik kaynağı).
 *
 * Denetlenen kurallar (§2.7):
 *   1) pr-impact job mevcut.
 *   2) needs: architecture korunuyor.
 *   3) Pull request koşulu mevcut (workflow on.pull_request + job PR'a koşulur).
 *   4) Planner ve runner adımları çağrılıyor.
 *   5) Job'ın hiçbir adımında continue-on-error: true yok.
 *   6) Runtime komutlarında `|| true` yok.
 *   7) Mutation env job düzeyinde true'ya çekilmemiş.
 *   8) Job'da yeni ham artifact upload path'i yok.
 *   9) Checkout diff için yeterli geçmişi getiriyor (fetch-depth: 0).
 *  10) Planner/runner sonucu kullanılmadan job yeşil olamıyor (gating run adımı).
 *
 * Çalıştır:  node tools/self-check-ci-workflow.mjs  (npm run quality:ci-workflow)
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseYamlSubset } from './yaml-subset.mjs';

const root = process.cwd();
const WF = path.join(root, '.github', 'workflows', 'playwright.yml');
const JOB = 'pr-impact';

const failures = [];
let caseNo = 0;
const check = (label, cond, detail = '') => {
  caseNo += 1;
  if (!cond) failures.push(`Kural ${caseNo} [${label}]: ${detail || 'ihlal'}`);
};

let doc;
try {
  doc = parseYamlSubset(readFileSync(WF, 'utf8'));
} catch (e) {
  console.error(`Workflow okunamadı/parse edilemedi: ${WF}\n${e.message}`);
  process.exit(1);
}

const jobs = doc && typeof doc.jobs === 'object' ? doc.jobs : {};
const job = jobs[JOB];

// 1) Job mevcut mu?
check('job-exists', !!job && typeof job === 'object', `jobs.${JOB} yok`);

if (!job) {
  for (const f of failures) console.error('  ✗ ' + f);
  console.error(`\n${failures.length} workflow enforcement ihlali (${caseNo} kural).`);
  process.exit(1);
}

const steps = Array.isArray(job.steps) ? job.steps : [];
const runStrings = steps
  .filter((s) => s && typeof s === 'object' && typeof s.run === 'string')
  .map((s) => s.run);
const usesStrings = steps
  .filter((s) => s && typeof s === 'object' && typeof s.uses === 'string')
  .map((s) => s.uses);
const joinedRuns = runStrings.join('\n');

// 2) needs: architecture.
{
  const needs = job.needs;
  const ok = needs === 'architecture' || (Array.isArray(needs) && needs.includes('architecture'));
  check('needs-architecture', ok, `needs=${JSON.stringify(needs)}`);
}

// 3) Pull request koşulu: workflow on.pull_request + job PR event'ine koşulur.
{
  const on = doc.on || doc.true; // 'on' bazı parserlarda boolean'a düşebilir; savunma
  const onHasPR = !!(on && typeof on === 'object' && 'pull_request' in on);
  const ifStr = typeof job.if === 'string' ? job.if : '';
  const jobRunsOnPR = /pull_request/.test(ifStr);
  check('pr-trigger', onHasPR, `on.pull_request yok`);
  check('job-pr-conditioned', jobRunsOnPR, `job.if PR'a koşmuyor: "${ifStr}"`);
}

// 4) Planner ve runner adımları çağrılıyor (script veya doğrudan dosya).
{
  const hasPlanner = /ci:impact:plan|plan-pr-impact\.mjs/.test(joinedRuns);
  const hasRunner = /ci:impact:run|run-pr-impact\.mjs/.test(joinedRuns);
  check('planner-step', hasPlanner, 'planner adımı yok');
  check('runner-step', hasRunner, 'runner adımı yok');
}

// 5) continue-on-error: true hiçbir adımda yok.
{
  const bad = steps.filter(
    (s) => s && typeof s === 'object' && String(s['continue-on-error']).toLowerCase() === 'true'
  );
  check('no-continue-on-error', bad.length === 0, `${bad.length} adımda continue-on-error:true`);
}

// 6) `|| true` (ve exit-code yutma) yok.
{
  const hasOrTrue = /\|\|\s*true\b/.test(joinedRuns);
  check('no-or-true', !hasOrTrue, 'runtime komutunda || true var');
}

// 7) Mutation env job düzeyinde true değil.
{
  const jobEnv = job.env && typeof job.env === 'object' ? job.env : {};
  const val = jobEnv.ALLOW_MUTATING_TESTS;
  const stepEnvTrue = steps.some(
    (s) => s && s.env && typeof s.env === 'object' && String(s.env.ALLOW_MUTATING_TESTS) === 'true'
  );
  check(
    'mutation-env-false',
    String(val) !== 'true' && !stepEnvTrue,
    `ALLOW_MUTATING_TESTS=${val}`
  );
}

// 8) Yeni ham artifact upload path'i yok (job'da upload-artifact adımı yok).
{
  const uploads = usesStrings.filter((u) => /actions\/upload-artifact@/.test(u));
  check('no-new-artifact-upload', uploads.length === 0, `${uploads.length} upload-artifact adımı`);
}

// 9) Checkout yeterli geçmişi getiriyor (fetch-depth: 0).
{
  const checkout = steps.find(
    (s) => s && typeof s === 'object' && typeof s.uses === 'string' && /actions\/checkout@/.test(s.uses)
  );
  const withB = checkout && checkout.with && typeof checkout.with === 'object' ? checkout.with : {};
  const depth = String(withB['fetch-depth']);
  check('checkout-fetch-depth', !!checkout && depth === '0', `fetch-depth=${withB['fetch-depth']}`);
}

// 10) Runner sonucu gating: runner adımı normal `run` (continue-on-error yok) ve
//     son anlamlı gating adımı → job yeşil olması runner exit 0'a bağlı.
{
  const runnerIdx = steps.findIndex(
    (s) => s && typeof s.run === 'string' && /ci:impact:run|run-pr-impact\.mjs/.test(s.run)
  );
  const runnerStep = runnerIdx >= 0 ? steps[runnerIdx] : null;
  const runnerGates =
    !!runnerStep &&
    String(runnerStep['continue-on-error']).toLowerCase() !== 'true' &&
    !/\|\|\s*true\b/.test(runnerStep.run);
  // Runner'dan SONRA gelen adımlar exit-code'u maskelememeli (yalnız !cancelled özet olabilir,
  // ama continue-on-error ile job'ı yeşile zorlayan bir adım olmamalı).
  const afterMasks = steps
    .slice(runnerIdx + 1)
    .some((s) => s && String(s['continue-on-error']).toLowerCase() === 'true' && typeof s.run === 'string');
  check('runner-gates-job', runnerGates && !afterMasks, `gates=${runnerGates} afterMasks=${afterMasks}`);
}

// ─────────────────────────────── Sonuç ───────────────────────────────
if (failures.length > 0) {
  for (const f of failures) console.error('  ✗ ' + f);
  console.error(`\n${failures.length} workflow enforcement ihlali (${caseNo} kural).`);
  process.exit(1);
}
console.log(`CI workflow enforcement geçti: ${caseNo} yapısal kural, pr-impact job sözleşmeye uyuyor.`);
