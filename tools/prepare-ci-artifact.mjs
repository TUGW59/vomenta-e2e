#!/usr/bin/env node
// @ts-check
/**
 * WP-SEC-B — Güvenli CI artifact hazırlayıcı (lane adapter + atomik bundle).
 *
 * Kullanım:
 *   node tools/prepare-ci-artifact.mjs --lane <lane>
 *
 * Özet lane'leri (public/authenticated/critical/full/visual/discovery):
 *   test-results/report.json (Playwright JSON reporter) -> güvenli kanonik model ->
 *   summary.json + junit.xml + summary.html + manifest.json (secret/PII + şema + FS
 *   denetiminden geçer) -> atomik test-results/secure-upload/<lane>/.
 *
 * nightly-known-bug-reconcile:
 *   test-results/findings/fixed-candidates.json -> şema + secret-scan -> bundle.
 *
 * forensic/verification lane'leri BURADA hazırlanmaz — kendi gated preparer'ları
 * vardır (report:bug / report:verify). Yanlış çağrı → açık hata.
 *
 * Çıktı: başarıda stdout'a YALNIZ güvenli özet (lane, dosya adları, bayt) + `ready`.
 * Herhangi bir güvenlik ihlali → non-zero exit; hassas değer ASLA yazılmaz.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { flattenPlaywrightReport } from './forensic-lib.mjs';
import {
  LANES,
  LANE_POLICY,
  lanePolicy,
  buildCanonicalModel,
  renderSummaryJson,
  renderJunitXml,
  renderSummaryHtml,
  finalizeBundle,
  ArtifactPolicyError,
  RULES,
} from './artifact-policy.mjs';

const root = resolve(process.cwd());

function fail(msg, ruleId) {
  console.error(`prepare-ci-artifact HATA${ruleId ? ` [${ruleId}]` : ''}: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  let lane = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--lane') lane = argv[i + 1];
    else if (argv[i].startsWith('--lane=')) lane = argv[i].slice('--lane='.length);
  }
  return { lane };
}

/** Güvenli sınırlı metadata (query/token yok). */
function safeMeta() {
  return {
    commit: process.env.GITHUB_SHA || null,
    runId: process.env.GITHUB_RUN_ID || null,
  };
}

/** Özet lane adapter'ı: JSON raporundan güvenli bundle üretir. */
function prepareSummaryLane(lane) {
  const reportPath = resolve(root, 'test-results', 'report.json');
  const meta = safeMeta();
  let flat = [];
  let sourceMissing = false;
  if (existsSync(reportPath)) {
    let report;
    try {
      report = JSON.parse(readFileSync(reportPath, 'utf8'));
    } catch {
      // Bozuk rapor: fail-closed. Boş güvenli özet üret (job zaten test adımından kırmızı).
      sourceMissing = true;
    }
    if (report) flat = flattenPlaywrightReport(report);
  } else {
    // Test adımı rapor üretmeden çöktü: güvenli boş özet (upload temiz kalır).
    sourceMissing = true;
  }
  const model = buildCanonicalModel(flat, { lane, commit: meta.commit, runId: meta.runId });
  if (sourceMissing) model.sourceMissing = true;
  const files = {
    'summary.json': renderSummaryJson(model),
    'junit.xml': renderJunitXml(model),
    'summary.html': renderSummaryHtml(model),
  };
  return finalizeBundle({
    lane,
    files,
    excludedLocalOnly: ['raw-playwright-report', 'raw-test-results', 'trace-zip', 'video', 'screenshots'],
  });
}

/** nightly reconcile adapter'ı: fixed-candidates.json şema + secret doğrular. */
function prepareReconcileLane(lane) {
  const src = resolve(root, 'test-results', 'findings', 'fixed-candidates.json');
  if (!existsSync(src)) {
    throw new ArtifactPolicyError(RULES.ART_EMPTY, 'fixed-candidates.json', 'kaynak öneri dosyası yok');
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(src, 'utf8'));
  } catch {
    throw new ArtifactPolicyError(RULES.ART_SCHEMA, 'fixed-candidates.json', 'geçersiz JSON');
  }
  // Dar şema doğrulaması: reconcile YALNIZ öneri üretir; registry değişmez.
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.candidates)) {
    throw new ArtifactPolicyError(RULES.ART_SCHEMA, 'fixed-candidates.json', 'candidates dizisi yok');
  }
  for (const c of parsed.candidates) {
    if (!c || typeof c.findingId !== 'string' || !c.findingId.trim()) {
      throw new ArtifactPolicyError(RULES.ART_SCHEMA, 'fixed-candidates.json', 'candidate.findingId eksik');
    }
    if (c.registryChanged !== false) {
      throw new ArtifactPolicyError(RULES.ART_SCHEMA, 'fixed-candidates.json', 'registryChanged=false olmalı');
    }
  }
  // Kanonik yeniden-emit (raw copy değil; yalnız doğrulanmış alanlar) — secret-scan finalize'da.
  const safe = {
    generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : null,
    commitSha: typeof parsed.commitSha === 'string' ? parsed.commitSha.slice(0, 40) : null,
    note: typeof parsed.note === 'string' ? parsed.note.slice(0, 500) : '',
    candidates: parsed.candidates.map((c) => ({
      findingId: String(c.findingId).slice(0, 32),
      reason: String(c.reason || '').slice(0, 64),
      recommendedStatus: String(c.recommendedStatus || '').slice(0, 64),
      registryChanged: false,
    })),
  };
  return finalizeBundle({
    lane,
    files: { 'fixed-candidates.json': JSON.stringify(safe, null, 2) + '\n' },
    excludedLocalOnly: ['raw-test-results'],
  });
}

function main() {
  const { lane } = parseArgs(process.argv.slice(2));
  if (!lane) fail('--lane <lane> zorunlu. Geçerli: ' + LANES.join(', '));
  if (!LANES.includes(lane)) fail(`kayıt dışı lane "${lane}". Geçerli: ${LANES.join(', ')}`, RULES.ART_WORKFLOW_UNKNOWN_LANE);

  const policy = LANE_POLICY[lane];
  if (policy.mode === 'legacy-prepared') {
    fail(
      `lane "${lane}" bu araçla hazırlanmaz; kendi gated preparer'ını kullan ` +
        '(known-bug-forensic → report:bug, known-bug-verification → report:verify).'
    );
  }

  let result;
  try {
    if (lane === 'nightly-known-bug-reconcile') result = prepareReconcileLane(lane);
    else result = prepareSummaryLane(lane);
  } catch (error) {
    if (error instanceof ArtifactPolicyError) fail(error.detail, error.ruleId);
    // Beklenmeyen hata da fail-closed.
    fail(String(error && error.message ? error.message : error));
    return;
  }

  // Güvenli özet — YALNIZ path/isim/sayı; içerik yok.
  console.log(
    `ready lane=${lane} files=[${result.files.join(', ')}] bytes=${result.bytes} -> ${result.secureRoot}`
  );
}

main();
