#!/usr/bin/env node
// @ts-check
/**
 * WP-R3/A — Tek bulgu forensik komutu.
 *
 *   npm run report:bug -- B4
 *
 * Ne yapar:
 *  1. CLI'dan bulgu id alır (yoksa/geçersizse non-zero exit).
 *  2. Registry'den kaydı + guard testini çözer (tests/contracts/known-bugs.js).
 *  3. FORENSIC_BUG env'i çelişiyorsa hard failure; mutation testini reddeder.
 *  4. YALNIZ o testi forensik modda koşar (FORENSIC_BUG=<id> → knownBugGuard
 *     beklenen-başarısızlığı atlar → gerçek sonuç + trace/screenshot üretilir).
 *  5. `test-results/findings/<id>/` altına güvenli kanıt paketi + `upload/` bundle yazar.
 *  6. Registry'yi DEĞİŞTİRMEZ; kök neden UYDURMAZ (possibleCauses=[], rootCauseCandidate=null).
 *
 * Not: production read-only. Mutation guard'ı atlatılmaz; video production forensikte kapalı.
 * Trace lokal üretilir, güvenliği binary düzeyde tam kanıtlanamadığı için CI'a YÜKLENMEZ.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { redactText } from '../tests/fixtures/sanitize.js';
import {
  resolveFinding,
  findingDir,
  assertForensicCliMatchesEnv,
  escapeRegExp,
  scanTraceZip,
  prepareUploadBundle,
  flattenPlaywrightReport,
  classifyRunResult,
  registryFingerprint,
} from './forensic-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`report:bug HATASI — ${message}`);
  process.exit(1);
}

// ── 1. Argüman ──────────────────────────────────────────────────────────────
const id = (process.argv[2] || '').trim();
if (!id) fail('bulgu id gerekli. Kullanım: npm run report:bug -- B4');

// ── 2. Registry çözümleme ─────────────────────────────────────────────────────
let finding;
try {
  finding = resolveFinding(id);
} catch (error) {
  fail(error.message);
}

// ── 3. Güvenlik ön-kontrolleri ────────────────────────────────────────────────
try {
  assertForensicCliMatchesEnv(id, process.env.FORENSIC_BUG);
} catch (error) {
  fail(error.message);
}
if (process.env.ALLOW_MUTATING_TESTS === 'true') {
  fail('forensik mod read-only çalışır; ALLOW_MUTATING_TESTS=true ile koşulamaz.');
}
if (/\.mutation\./.test(finding.test.file)) {
  fail(`bulgu testi bir mutation spec'i (${finding.test.file}); forensik mod mutation koşmaz.`);
}

const fingerprintBefore = registryFingerprint(root);
const dirRel = findingDir(id);
const dirAbs = resolve(root, dirRel);
rmSync(dirAbs, { recursive: true, force: true });
mkdirSync(dirAbs, { recursive: true });

// ── 4. Forensik koşu ──────────────────────────────────────────────────────────
const args = [
  'playwright',
  'test',
  finding.test.file,
  '--project=chromium-authed',
  '--grep',
  escapeRegExp(finding.test.title),
  '--workers=1',
  '--retries=0',
  '--reporter=json',
];
console.log(`▶ forensik koşu: ${id} → ${finding.test.file} :: ${finding.test.title}`);

let stdout = '';
let runExitOk = true;
try {
  stdout = execFileSync('npx', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    env: { ...process.env, FORENSIC_BUG: id, ALLOW_MUTATING_TESTS: 'false' },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
} catch (error) {
  // Forensik reproduce'da test GERÇEKTEN başarısız olur → npx non-zero döner. Bu beklenen.
  runExitOk = false;
  stdout = error.stdout ? String(error.stdout) : '';
}

/** @type {any} */
let report = null;
try {
  report = JSON.parse(stdout);
} catch {
  report = null;
}

const flat = report ? flattenPlaywrightReport(report) : [];
// grep tek testi hedefler; birden çok eşleşirse ilk (aynı başlık) alınır.
const target = flat.find((t) => t.title === finding.test.title) || flat[0];
const result = classifyRunResult(target);

// ── 5. Trace (lokal-only) + tarama ────────────────────────────────────────────
let traceScan = { tool: 'none', hits: [], undecodable: 0, scanned: 0, uploaded: false };
const traceAttachment = target?.attachments?.find((a) => a.name === 'trace' && a.path);
if (traceAttachment?.path && existsSync(traceAttachment.path)) {
  copyFileSync(traceAttachment.path, join(dirAbs, 'trace.zip'));
  const scan = scanTraceZip(join(dirAbs, 'trace.zip'), join(dirAbs, '.trace-scan-tmp'));
  traceScan = { ...scan, uploaded: false };
}

// ── 6. candidate-update.json (yalnız gözlemlenebilir kanıt; kök neden UYDURULMAZ) ──
/** @type {string[]} */
const technicalEvidence = [];
if (target) {
  technicalEvidence.push(`status=${target.status} (expectedStatus=${target.expectedStatus})`);
  if (typeof target.durationMs === 'number') technicalEvidence.push(`durationMs=${target.durationMs}`);
  if (target.project) technicalEvidence.push(`project=${target.project}`);
  if (target.error) {
    const firstLine = redactText(String(target.error).split('\n')[0], { maxLen: 300 });
    technicalEvidence.push(`assertionError=${firstLine}`);
  }
  const netPath = join(dirAbs, 'network-summary.json');
  if (existsSync(netPath)) technicalEvidence.push('network-summary.json üretildi');
} else {
  technicalEvidence.push('koşu sonucu bulunamadı (grep eşleşmedi / rapor boş)');
}

const commitSha = process.env.GITHUB_SHA || null;
const workflowRun = process.env.GITHUB_RUN_ID || null;

const candidate = {
  findingId: id,
  generatedAt: new Date().toISOString(),
  environment: 'production-readonly',
  commitSha,
  workflowRun,
  result,
  technicalEvidence, // yalnız deterministik/gözlemlenebilir
  possibleCauses: [], // otomasyon DOLDURMAZ
  rootCauseCandidate: null, // otomasyon ÜRETMEZ
  attachments: [],
};

// ── metadata.json ──
const metadata = {
  findingId: id,
  title: finding.title,
  test: finding.test,
  guard: finding.guard,
  environment: 'production-readonly',
  commitSha,
  workflowRun,
  result,
  runExitOk,
  reportParsed: report !== null,
  videoPolicy: 'off (production forensik)',
  trace: {
    producedLocally: existsSync(join(dirAbs, 'trace.zip')),
    scan: traceScan,
    uploadPolicy: 'local-only (binary düzeyde tam kanıtlanamaz → CI upload dışı)',
  },
  registryFingerprint: fingerprintBefore,
};

// Attachment envanterini candidate'a işle (yalnız güvenli olanlar).
for (const name of ['network-summary.json', 'safe-final-state.png']) {
  if (existsSync(join(dirAbs, name))) candidate.attachments.push(name);
}

writeFileSync(join(dirAbs, 'candidate-update.json'), JSON.stringify(candidate, null, 2) + '\n');
writeFileSync(join(dirAbs, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');

// ── Registry değişmedi mi (defansif) ──
const fingerprintAfter = registryFingerprint(root);
if (fingerprintAfter !== fingerprintBefore) {
  fail('registry parmak izi değişti — forensik mod registry\'yi ASLA değiştirmemeli.');
}

// ── 7. Güvenli upload bundle ──
const bundle = prepareUploadBundle(dirAbs);
if (bundle.rejected.length > 0) {
  console.error('Artifact güvenlik kapısı REDDETTİ:');
  for (const r of bundle.rejected) console.error(`  ✗ ${r.name}: ${r.reason}`);
  fail('güvenli olmayan/beklenmeyen dosya bulundu; upload bundle üretilmedi.');
}

console.log(`✔ sonuç: ${result}`);
console.log(`✔ kanıt dizini: ${dirRel}/`);
console.log(`✔ upload bundle: ${dirRel}/upload/ → ${bundle.copied.join(', ') || '(boş)'}`);
if (bundle.skippedLocal.length) console.log(`  (lokal-only, upload dışı: ${bundle.skippedLocal.join(', ')})`);
if (traceScan.tool !== 'none') {
  console.log(`  trace taraması: ${traceScan.hits.length} sızıntı, ${traceScan.undecodable} çözülemeyen girdi (lokal-only)`);
}
console.log('✔ registry değişmedi; possibleCauses=[], rootCauseCandidate=null (kök neden uydurulmadı).');
