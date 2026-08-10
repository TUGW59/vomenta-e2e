// @ts-check
/**
 * NIGHTLY PROD-HEALTH GATE — STATİK ENFORCEMENT (WP-NIGHT-INFRA).
 *
 * `.github/workflows/playwright.yml`'i YAPISAL parse ederek (metin araması değil)
 * prod-health preflight gate'inin bozulmadan durduğunu kanıtlar. Bu kapı olmadan
 * bir gelecekteki düzenleme gate'i sessizce kaldırıp dead-nightly'yi geri getirebilir.
 *
 * Denetlenen kurallar:
 *   1) prod-health job mevcut, needs: architecture.
 *   2) prod-health `up` çıktısını bir step çıktısından türetir.
 *   3) prod-health bir adımda tools/prod-health-probe.mjs çağırır.
 *   4) prod-health hiçbir upload-artifact adımı EKLEMEZ (yalnız sınıflandırıcı).
 *   5) prod-health.if, aşağıdaki lane'lerin tetikleyici BİRLEŞİMİNİ kapsar
 *      (schedule + workflow_dispatch + collect_evidence) → "skipped-need" tuzağı yok.
 *   6) 5 authed nightly lane'in HER BİRİ prod-health'e needs ile bağlı VE
 *      if'inde `needs.prod-health.outputs.up == 'true'` kapısını taşır.
 *   7) Probe fail-open: process.exit(0) var, process.exit(1)/(2) YOK; `up=` çıktısı yazar.
 *
 * Çalıştır:  node tools/self-check-nightly-infra-gate.mjs  (npm run quality:nightly-gate)
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseYamlSubset } from './yaml-subset.mjs';

const root = process.cwd();
const WF = path.join(root, '.github', 'workflows', 'playwright.yml');
const PROBE = path.join(root, 'tools', 'prod-health-probe.mjs');
const GATE_JOB = 'prod-health';
/** prod-health'e koşullanması ZORUNLU authed nightly lane'ler. */
const GATED_LANES = [
  'full-regression',
  'visual-regression',
  'read-only-discovery',
  'nightly-known-bug-reconcile',
  'known-bug-evidence',
  'nightly-draft-findings',
];

const failures = [];
let caseNo = 0;
const check = (label, cond, detail = '') => {
  caseNo += 1;
  if (!cond) failures.push(`Kural ${caseNo} [${label}]: ${detail || 'ihlal'}`);
};

/** Flow-list ("[a, b]") ya da blok dizisini elemanlara böler. */
function needsList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim());
  if (typeof value !== 'string') return [];
  const m = value.trim().match(/^\[(.*)\]$/s);
  const body = m ? m[1] : value;
  return body
    .split(',')
    .map((s) => s.replace(/['"]/g, '').trim())
    .filter(Boolean);
}

let doc;
try {
  doc = parseYamlSubset(readFileSync(WF, 'utf8'));
} catch (e) {
  console.error(`Workflow okunamadı/parse edilemedi: ${WF}\n${e && e.message}`);
  process.exit(1);
}

const jobs = doc && typeof doc.jobs === 'object' ? doc.jobs : {};
const gate = jobs[GATE_JOB];

// 1) prod-health job + needs: architecture.
check('gate-job-exists', !!gate && typeof gate === 'object', `jobs.${GATE_JOB} yok`);
if (gate && typeof gate === 'object') {
  check('gate-needs-architecture', needsList(gate.needs).includes('architecture'), `needs=${JSON.stringify(gate.needs)}`);

  // 2) up çıktısı bir step çıktısından türer.
  const up = gate.outputs && typeof gate.outputs === 'object' ? String(gate.outputs.up || '') : '';
  check('gate-outputs-up', /steps\.[A-Za-z0-9_-]+\.outputs\.up/.test(up), `outputs.up=${JSON.stringify(up)}`);

  const gSteps = Array.isArray(gate.steps) ? gate.steps : [];
  const gRuns = gSteps.filter((s) => s && typeof s.run === 'string').map((s) => s.run).join('\n');
  const gUses = gSteps.filter((s) => s && typeof s.uses === 'string').map((s) => s.uses);

  // 3) probe çağrılıyor.
  check('gate-runs-probe', /prod-health-probe\.mjs/.test(gRuns), 'prod-health-probe.mjs çağrılmıyor');

  // 4) upload-artifact YOK.
  const uploads = gUses.filter((u) => /actions\/upload-artifact@/.test(u));
  check('gate-no-upload', uploads.length === 0, `${uploads.length} upload-artifact adımı`);

  // 5) if birleşim üst-kümesi (schedule + dispatch + collect_evidence).
  const gIf = String(gate.if || '');
  check(
    'gate-if-superset',
    /schedule/.test(gIf) && /workflow_dispatch/.test(gIf) && /collect_evidence/.test(gIf),
    `gate.if="${gIf.replace(/\s+/g, ' ').trim()}"`
  );
}

// 6) Her lane prod-health'e bağlı + if'te up=='true' kapısı.
for (const lane of GATED_LANES) {
  const job = jobs[lane];
  if (!job || typeof job !== 'object') {
    check(`lane-exists:${lane}`, false, `jobs.${lane} yok`);
    continue;
  }
  check(`lane-needs-gate:${lane}`, needsList(job.needs).includes(GATE_JOB), `needs=${JSON.stringify(job.needs)}`);
  const ifStr = String(job.if || '');
  check(
    `lane-if-gate:${lane}`,
    /needs\.prod-health\.outputs\.up\s*==\s*'true'/.test(ifStr),
    `if="${ifStr.replace(/\s+/g, ' ').trim()}"`
  );
}

// 7) Probe fail-open.
let probeSrc = '';
try {
  probeSrc = readFileSync(PROBE, 'utf8');
} catch {
  check('probe-exists', false, `${PROBE} okunamadı`);
}
if (probeSrc) {
  check('probe-exit-0', /process\.exit\(0\)/.test(probeSrc), 'process.exit(0) yok');
  check('probe-no-nonzero-exit', !/process\.exit\(\s*[1-9]/.test(probeSrc), 'probe non-zero exit içeriyor (fail-open değil)');
  check('probe-writes-up', /up=\$\{|`up=|'up='|"up="|up=\$\{up/.test(probeSrc) || /appendFileSync\([^)]*up=/.test(probeSrc) || /`up=/.test(probeSrc), 'up= çıktısı yazılmıyor');
}

if (failures.length > 0) {
  for (const f of failures) console.error('  ✗ ' + f);
  console.error(`\n${failures.length} nightly-gate enforcement ihlali (${caseNo} kural).`);
  process.exit(1);
}
console.log(`Nightly prod-health gate kapısı geçti: ${caseNo} yapısal kural — prod-health preflight + ${GATED_LANES.length} authed lane gate'i + fail-open probe sözleşmeye uyuyor.`);
