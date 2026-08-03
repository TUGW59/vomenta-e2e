#!/usr/bin/env node
// @ts-check
/**
 * EXECUTIVE-REPORT SELF-CHECK — SERT KAPI (WP-REPORT-TRUTH-2 / FAZ 6).
 *
 * `tools/executive-report-lib.mjs` + `tools/generate-executive-report.mjs`'in
 * dürüstlük sözleşmelerini TAMAMEN SENTETİK fixture'larla, production'a
 * BAĞLANMADAN doğrular (HANDOFF §6.3–§6.7). Pozitif + NEGATİF vakalar.
 *
 * Çalıştır:  node tools/self-check-executive-report.mjs  (npm run quality:executive)
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildExecutiveModel,
  computeTrend,
  buildRiskGaps,
  checkConsistency,
  summarizeRuntime,
  summarizeDepth,
  summarizeFindings,
  renderExecutiveHtml,
  renderExecutiveMarkdown,
  renderExecutiveJson,
  validateExecutiveInvariants,
  SCHEMA_VERSION,
} from './executive-report-lib.mjs';
import { scanOutputLeaks } from './runtime-report-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = resolve(root, 'tools/generate-executive-report.mjs');
const GEN_AT = '2026-08-03T06:00:00.000Z';

const errors = [];
const fail = (m) => errors.push(m);
const ok = (cond, m) => { if (!cond) fail(m); };

// ── Sentetik fixture kurucular (gerçek kullanıcı verisi YOK) ─────────────────
function runtimeFixture(over = {}) {
  const totals = over.routeStatusTotals || { PASS: 3, FAIL: 1, FLAKY: 1, BLOCKED: 1, NOT_RUN: 1 };
  const reg = totals.PASS + totals.FAIL + totals.FLAKY + totals.BLOCKED + totals.NOT_RUN;
  return {
    schemaVersion: 1,
    generatedAt: '2026-08-03T05:00:00.000Z',
    provenance: over.provenance || { verdict: 'UNVERIFIED', reasons: ['sha-mismatch', 'runid-missing'] },
    source: over.source || { commitSha: 'aaaa1111', environment: 'production-read-only', browser: 'chromium', project: 'chromium-authed', runId: null },
    inventory: {
      registeredRoutes: reg,
      testedPagesContracts: 4,
      knownBugs: over.knownBugs || { total: 5, open: 4, fixedCandidate: 0, closed: 1 },
      definedLogical: over.definedLogical ?? 120,
      runnableInventory: over.runnableInventory ?? null,
    },
    runtime: {
      selectedThisRun: over.selectedThisRun ?? 7,
      executedThisRun: over.executedThisRun ?? 6,
      passedThisRun: 3, failedThisRun: 1, flakyThisRun: 1, skippedThisRun: 1, knownBugExpectedFail: 0,
      routeStatusTotals: totals,
    },
    pages: over.pages || [
      { route: '/a', baselineStatus: 'PASS', statusReason: 'passed', flaky: 0, durationMs: 5000 },
      { route: '/b', baselineStatus: 'FAIL', statusReason: 'unexpected-failure', flaky: 0, durationMs: 8000 },
      { route: '/c', baselineStatus: 'FLAKY', statusReason: 'retry-pass', flaky: 1, durationMs: 3000 },
      { route: '/d', baselineStatus: 'BLOCKED', statusReason: 'skipped-or-fixme', flaky: 0, durationMs: 0 },
      { route: '/e', baselineStatus: 'NOT_RUN', statusReason: 'inventory-only', flaky: 0, durationMs: null },
      { route: '/f', baselineStatus: 'PASS', statusReason: 'passed', flaky: 0, durationMs: 6000 },
      { route: '/g', baselineStatus: 'PASS', statusReason: 'passed', flaky: 0, durationMs: 2000 },
    ],
    unmappedTests: over.unmappedTests || [{ file: 'x.spec.js', title: 't', project: 'p', status: 'passed', routeMarker: null }],
    unmappedFindings: [],
  };
}

function depthFixture(over = {}) {
  const reg = over.registeredRoutes ?? 7;
  const l1Proven = over.l1Proven ?? 5;
  const l1NotProven = reg - l1Proven;
  const l2Complete = over.l2Complete ?? 1;
  const l2Partial = over.l2Partial ?? (reg - l2Complete);
  return {
    schemaVersion: 1,
    generatedAt: '2026-08-03T05:00:00.000Z',
    source: over.source || { sourceCommit: 'aaaa1111', environment: 'production-read-only', browser: 'chromium' },
    totals: {
      registeredRoutes: reg, l1Proven, l1NotProven,
      l2StyleContractMet: reg, l2StyleGap: 0,
      l2Complete, l2Partial, l2NotCovered: 0,
      interactionUnverifiedRoutes: reg - l2Complete,
      l3Blocked: 4, l3NotApplicable: 3, l4Blocked: reg, l5Blocked: reg,
      highestLevel: { L0: l1NotProven, L1: 0, L2_STYLE: reg - l2Complete - l1NotProven, L2_DEEP: l2Complete },
      routesWithFindings: 2, openFindingsOnRoutes: 3,
    },
    pages: over.pages || [
      { route: '/a', heading: 'A', contracts: ['a'], highestProvenLevel: 'L2_STYLE', levels: { L1: { status: 'PROVEN' }, L2: { status: 'PARTIAL' }, L3: { status: 'NOT_APPLICABLE', reasonCode: 'NO_WRITE_SURFACE' }, L4: { status: 'BLOCKED', reasonCode: 'ROLE_ACCOUNTS_REQUIRED' }, L5: { status: 'BLOCKED', reasonCode: 'PROVIDER_HARNESS_REQUIRED' } }, findings: [] },
      { route: '/b', heading: 'B', contracts: ['b'], highestProvenLevel: 'L0', levels: { L1: { status: 'NOT_PROVEN' }, L2: { status: 'PARTIAL' }, L3: { status: 'BLOCKED', reasonCode: 'STAGING_REQUIRED' }, L4: { status: 'BLOCKED', reasonCode: 'ROLE_ACCOUNTS_REQUIRED' }, L5: { status: 'BLOCKED', reasonCode: 'PROVIDER_HARNESS_REQUIRED' } }, findings: [] },
    ],
  };
}

function findingsFixture(over = {}) {
  return {
    total: over.list ? over.list.length : 5,
    findings: over.list || [
      { id: 'F1', severity: 'critical', status: 'open', route: '/b' },
      { id: 'F2', severity: 'high', status: 'open', route: '/a' },
      { id: 'F3', severity: 'medium', status: 'open', route: '/a' },
      { id: 'F4', severity: 'low', status: 'open', route: '/z' },
      { id: 'F5', severity: 'high', status: 'closed', route: '/a' },
    ],
  };
}

// ── 1) Üç kaynak → üç ayrı bölüm; semantik karışmaz ──────────────────────────
{
  const m = buildExecutiveModel({ runtime: runtimeFixture(), depth: depthFixture(), findings: findingsFixture(), generatedAt: GEN_AT });
  ok(m.runtimeSummary && m.depthSummary && m.findingsSummary, '1: üç bölüm de mevcut olmalı.');
  ok(m.runtimeSummary.registeredRoutes === 7 && m.depthSummary.registeredRoutes === 7, '1: runtime ve depth kendi kayıtlı rotasını taşımalı.');
  // L1 proven (5) ile L2 complete (1) AYRI sayılar.
  ok(m.depthSummary.l1Proven === 5 && m.depthSummary.l2Complete === 1, '1: L1-proven ve L2-complete ayrı olmalı.');
}

// ── 2) FAIL/FLAKY/BLOCKED/NOT_RUN gizlenmez ──────────────────────────────────
{
  const m = buildExecutiveModel({ runtime: runtimeFixture(), depth: depthFixture(), findings: findingsFixture(), generatedAt: GEN_AT });
  const t = m.runtimeSummary.routeStatusTotals;
  ok(t.FAIL === 1 && t.FLAKY === 1 && t.BLOCKED === 1 && t.NOT_RUN === 1, '2: FAIL/FLAKY/BLOCKED/NOT_RUN korunmalı.');
  const md = renderExecutiveMarkdown(m);
  ok(/FAIL 1/.test(md) && /FLAKY 1/.test(md) && /BLOCKED 1/.test(md) && /NOT_RUN 1/.test(md), '2: MD hepsini göstermeli.');
  // blocked/dikkat listesi FAIL+FLAKY+BLOCKED+NOT_RUN içermeli (4 rota).
  ok(m.blockedRuntimeRoutes.length === 4, `2: dikkat gerektiren rota=4 beklenir, ${m.blockedRuntimeRoutes.length} bulundu.`);
}

// ── 3) Yanıltıcı "L2 tamamlandı" YASAK ───────────────────────────────────────
{
  // Tüm rotalar L1 PASS ama L2 complete yalnız 1 → rapor asla "L2 tamam" dememeli.
  const rt = runtimeFixture({ routeStatusTotals: { PASS: 7, FAIL: 0, FLAKY: 0, BLOCKED: 0, NOT_RUN: 0 } });
  const dp = depthFixture({ l1Proven: 7, l2Complete: 1 });
  const m = buildExecutiveModel({ runtime: rt, depth: dp, findings: findingsFixture(), generatedAt: GEN_AT });
  const md = renderExecutiveMarkdown(m);
  const html = renderExecutiveHtml(m);
  ok(/L2 tamamlandı/i.test(md) && /YANLIŞ ÖZET YASAK|≠/.test(md), '3: MD L2-yanılgısına karşı açık uyarı içermeli.');
  ok(/L2 complete.*?1|Gerçekten L2 tamamlanan rota.*?1/s.test(md), '3: L2 complete gerçek sayısı (1) gösterilmeli.');
  ok(m.depthSummary.l2Complete !== m.depthSummary.registeredRoutes, '3: l2Complete asla registeredRoutes\'a eşitlenmemeli.');
  ok(/Yanlış özet yasak/i.test(html), '3: HTML de yanılgı uyarısı içermeli.');
}

// ── 4) Kaynaklar arası DRIFT sessizce gizlenmez ──────────────────────────────
{
  // runtime 7 rota / bulgu total 5; depth 9 rota; findings registry 6.
  const rt = runtimeFixture({ knownBugs: { total: 5, open: 4, fixedCandidate: 0, closed: 1 } });
  const dp = depthFixture({ registeredRoutes: 9, l1Proven: 5, l2Complete: 1, l2Partial: 8 });
  const fn = findingsFixture({ list: [
    { id: 'F1', severity: 'critical', status: 'open', route: '/b' },
    { id: 'F2', severity: 'high', status: 'open', route: '/a' },
    { id: 'F3', severity: 'medium', status: 'open', route: '/a' },
    { id: 'F4', severity: 'low', status: 'open', route: '/z' },
    { id: 'F5', severity: 'high', status: 'open', route: '/a' },
    { id: 'F6', severity: 'medium', status: 'closed', route: '/a' },
  ] });
  const m = buildExecutiveModel({ runtime: rt, depth: dp, findings: fn, generatedAt: GEN_AT });
  ok(m.consistency.verdict === 'DRIFT', '4: farklı kayıtlı rota + bulgu sayısı DRIFT vermeli.');
  ok(m.consistency.warnings.some((w) => /Kayıtlı rota sayısı/.test(w)), '4: kayıtlı-rota drift uyarısı olmalı.');
  ok(m.consistency.warnings.some((w) => /Bilinen bulgu toplamı/.test(w)), '4: bulgu-toplamı drift uyarısı olmalı.');
  // Sayı seçimi YAPILMAMALI: her bölüm kendi kaynağını taşır.
  ok(m.runtimeSummary.registeredRoutes === 7 && m.depthSummary.registeredRoutes === 9, '4: her bölüm kendi rota sayısını korumalı (biri diğerini ezmemeli).');
}

// ── 5) CONSISTENT vakası (aynı sayılar, VERIFIED) → drift uyarısı yok ─────────
{
  const rt = runtimeFixture({ provenance: { verdict: 'VERIFIED', reasons: [] }, source: { commitSha: 'bbbb2222', environment: 'production-read-only', browser: 'chromium', project: 'chromium-authed', runId: '99' }, knownBugs: { total: 6, open: 4, fixedCandidate: 0, closed: 2 } });
  const dp = depthFixture({ source: { sourceCommit: 'bbbb2222', environment: 'production-read-only', browser: 'chromium' } });
  const fn = findingsFixture({ list: [
    { id: 'F1', severity: 'critical', status: 'open', route: '/b' },
    { id: 'F2', severity: 'high', status: 'open', route: '/a' },
    { id: 'F3', severity: 'medium', status: 'open', route: '/a' },
    { id: 'F4', severity: 'low', status: 'open', route: '/z' },
    { id: 'F5', severity: 'high', status: 'closed', route: '/a' },
    { id: 'F6', severity: 'medium', status: 'closed', route: '/a' },
  ] });
  const m = buildExecutiveModel({ runtime: rt, depth: dp, findings: fn, generatedAt: GEN_AT });
  ok(m.consistency.verdict === 'CONSISTENT', `5: uyumlu kaynak + VERIFIED → CONSISTENT beklenir, uyarılar: ${m.consistency.warnings.join('|')}`);
  ok(m.headlineProvenance === 'VERIFIED', '5: manşet provenance VERIFIED olmalı.');
}

// ── 6) Provenance UNVERIFIED → manşet uyarısı ────────────────────────────────
{
  const m = buildExecutiveModel({ runtime: runtimeFixture(), depth: depthFixture(), findings: findingsFixture(), generatedAt: GEN_AT });
  ok(m.headlineProvenance === 'UNVERIFIED', '6: manşet provenance UNVERIFIED olmalı.');
  const md = renderExecutiveMarkdown(m);
  ok(/UNVERIFIED/.test(md) && /kanıtlamaz|DİKKAT/i.test(md), '6: MD taze-olmayan koşum uyarısı içermeli.');
  ok(m.consistency.warnings.some((w) => /provenance/i.test(w)), '6: provenance uyarısı consistency\'de olmalı.');
}

// ── 7) INSUFFICIENT_HISTORY (0 veya 1 snapshot) ──────────────────────────────
{
  ok(computeTrend([], SCHEMA_VERSION).status === 'INSUFFICIENT_HISTORY', '7: geçmiş yok → INSUFFICIENT_HISTORY.');
  const one = [{ schemaVersion: 1, source: { commitSha: 'c1', runId: '1' }, generatedAt: GEN_AT, failingTestKeys: [] }];
  ok(computeTrend(one, SCHEMA_VERSION).status === 'INSUFFICIENT_HISTORY', '7: tek snapshot → INSUFFICIENT_HISTORY.');
  const m = buildExecutiveModel({ runtime: runtimeFixture(), depth: depthFixture(), findings: findingsFixture(), generatedAt: GEN_AT });
  ok(m.trend.status === 'INSUFFICIENT_HISTORY', '7: history verilmeyince model trend INSUFFICIENT_HISTORY olmalı.');
  ok(/INSUFFICIENT_HISTORY/.test(renderExecutiveMarkdown(m)), '7: MD INSUFFICIENT_HISTORY yazmalı.');
}

// ── 8) Trend OK (≥2 uygun snapshot) + yeni/düzelmiş failure ──────────────────
{
  const hist = [
    { schemaVersion: 1, source: { commitSha: 'c1', runId: '1' }, generatedAt: '2026-08-01T00:00:00Z', failingTestKeys: ['A|chromium|/x', 'B|chromium|/y'] },
    { schemaVersion: 1, source: { commitSha: 'c2', runId: '2' }, generatedAt: '2026-08-02T00:00:00Z', failingTestKeys: ['B|chromium|/y', 'C|chromium|/z'] },
  ];
  const tr = computeTrend(hist, SCHEMA_VERSION);
  ok(tr.status === 'OK', '8: iki uygun snapshot → trend OK.');
  ok(tr.newFailures.length === 1 && tr.newFailures[0] === 'C|chromium|/z', '8: yeni failure C olmalı.');
  ok(tr.fixedFailures.length === 1 && tr.fixedFailures[0] === 'A|chromium|/x', '8: düzelen failure A olmalı.');
}

// ── 9) Trend kimlik/şema kapısı: kimliksiz ve şema-uyumsuz snapshot elenir ────
{
  const noId = [
    { schemaVersion: 1, source: { commitSha: 'c1' }, generatedAt: GEN_AT, failingTestKeys: [] }, // runId yok
    { schemaVersion: 1, source: { commitSha: 'c2', runId: '2' }, generatedAt: GEN_AT, failingTestKeys: [] },
  ];
  const t1 = computeTrend(noId, SCHEMA_VERSION);
  ok(t1.status === 'INSUFFICIENT_HISTORY', '9: kimliksiz snapshot elenince yeterli geçmiş kalmamalı.');
  ok(t1.warnings.some((w) => /Commit\/run kimliği/.test(w)), '9: kimlik uyarısı olmalı.');
  const badSchema = [
    { schemaVersion: 99, source: { commitSha: 'c1', runId: '1' }, generatedAt: GEN_AT, failingTestKeys: [] },
    { schemaVersion: 1, source: { commitSha: 'c2', runId: '2' }, generatedAt: GEN_AT, failingTestKeys: [] },
    { schemaVersion: 1, source: { commitSha: 'c3', runId: '3' }, generatedAt: GEN_AT, failingTestKeys: [] },
  ];
  const t2 = computeTrend(badSchema, SCHEMA_VERSION);
  ok(t2.status === 'OK' && t2.warnings.some((w) => /Şema uyumsuz/.test(w)), '9: şema-uyumsuz snapshot warning ile elenmeli, kalan 2 ile OK.');
}

// ── 10) riskGaps: L1-not-proven + open critical/high tespiti ──────────────────
{
  const dp = summarizeDepth(depthFixture());
  const fn = summarizeFindings(findingsFixture());
  const gaps = buildRiskGaps(dp, fn);
  ok(gaps.some((g) => g.kind === 'L1_NOT_PROVEN' && g.route === '/b'), '10: /b L1_NOT_PROVEN boşluğu olmalı.');
  ok(gaps.some((g) => g.kind === 'OPEN_CRITICAL_HIGH_FINDING' && g.route === '/b'), '10: /b critical bulgu boşluğu olmalı.');
  ok(gaps.some((g) => g.kind === 'OPEN_CRITICAL_HIGH_FINDING' && g.route === '/a'), '10: /a high bulgu boşluğu olmalı.');
  ok(gaps[0].rank === 0, '10: en yüksek öncelik (rank 0 = L1-not-proven) başta olmalı.');
}

// ── 11) HTML güvenli (kendi kendine yeten) + üretilen çıktı güvenli ──────────
{
  const m = buildExecutiveModel({ runtime: runtimeFixture(), depth: depthFixture(), findings: findingsFixture(), generatedAt: GEN_AT });
  let threw = false;
  try { renderExecutiveHtml(m); } catch { threw = true; }
  ok(!threw, '11: üretilen HTML assertHtmlSafe geçmeli.');
  const html = renderExecutiveHtml(m);
  ok(!/<script\b/i.test(html) && !/<iframe\b/i.test(html) && !/\bhref\s*=\s*["']https?:/i.test(html), '11: HTML script/iframe/dış-http içermemeli.');
}

// ── 12) PII/mutlak-yol kaynak alanlarından çıktıya SIZMAZ ────────────────────
{
  const rt = runtimeFixture({ pages: [
    { route: '/a', baselineStatus: 'PASS', statusReason: 'passed', flaky: 0, durationMs: 1000 },
    { route: '/leak', baselineStatus: 'FAIL', statusReason: 'user test@example.com', flaky: 0, durationMs: 2000 },
    { route: '/c', baselineStatus: 'FLAKY', statusReason: 'retry', flaky: 1, durationMs: 1000 },
    { route: '/d', baselineStatus: 'BLOCKED', statusReason: 'x', flaky: 0, durationMs: 0 },
    { route: '/e', baselineStatus: 'NOT_RUN', statusReason: 'x', flaky: 0, durationMs: null },
    { route: '/f', baselineStatus: 'PASS', statusReason: 'x', flaky: 0, durationMs: 1000 },
    { route: '/g', baselineStatus: 'PASS', statusReason: 'x', flaky: 0, durationMs: 1000 },
  ] });
  const fn = findingsFixture({ list: [
    { id: 'F1', severity: 'critical', status: 'open', route: '/Users/secretuser/repo/b' },
    { id: 'tok eyJhbGciOiJI.eyJzdWIiOiIx.abcd1234', severity: 'high', status: 'open', route: '/a' },
  ] });
  const m = buildExecutiveModel({ runtime: rt, depth: depthFixture(), findings: fn, generatedAt: GEN_AT });
  const blob = renderExecutiveJson(m) + renderExecutiveMarkdown(m) + renderExecutiveHtml(m);
  const leaks = scanOutputLeaks(blob);
  ok(leaks.length === 0, `12: çıktıda sızıntı olmamalı, bulundu: ${leaks.join(',')}`);
  ok(!blob.includes('test@example.com'), '12: e-posta maskelenmeli.');
  ok(!blob.includes('/Users/secretuser'), '12: mutlak yerel yol sızmamalı.');
}

// ── 13) invariant fail-closed (bozuk runtime toplamı) ────────────────────────
{
  let caught = false;
  try {
    validateExecutiveInvariants({
      schemaVersion: SCHEMA_VERSION,
      runtimeSummary: { registeredRoutes: 7, routeStatusTotals: { PASS: 1, FAIL: 0, FLAKY: 0, BLOCKED: 0, NOT_RUN: 0 } },
      depthSummary: null, findingsSummary: { total: 1 }, trend: { status: 'INSUFFICIENT_HISTORY' },
    });
  } catch { caught = true; }
  ok(caught, '13: runtime toplam ≠ kayıtlı rota → invariant fırlatmalı.');
  // depth L2 toplamı bozuk → fırlatmalı
  let caught2 = false;
  try {
    validateExecutiveInvariants({
      schemaVersion: SCHEMA_VERSION, runtimeSummary: null,
      depthSummary: { registeredRoutes: 7, l1Proven: 5, l1NotProven: 2, l2Complete: 1, l2Partial: 1, l2NotCovered: 0 },
      findingsSummary: null, trend: { status: 'INSUFFICIENT_HISTORY' },
    });
  } catch { caught2 = true; }
  ok(caught2, '13: depth L2 complete+partial+notCovered ≠ kayıtlı rota → fırlatmalı.');
}

// ── 14) Eksik kaynak: findings-only yine dürüst rapor üretir ──────────────────
{
  const m = buildExecutiveModel({ runtime: null, depth: null, findings: findingsFixture(), generatedAt: GEN_AT });
  ok(m.runtimeSummary === null && m.depthSummary === null && m.findingsSummary, '14: yalnız findings ile model kurulmalı.');
  ok(m.missingSources.includes('runtime') && m.missingSources.includes('depth'), '14: eksik kaynaklar listelenmeli.');
  ok(m.headlineProvenance === 'NO_RUNTIME_SOURCE', '14: runtime yoksa manşet NO_RUNTIME_SOURCE.');
  const md = renderExecutiveMarkdown(m);
  ok(/Runtime kaynağı yok|⛔/.test(md), '14: MD eksik runtime\'ı açıkça belirtmeli.');
}

// ── 15) summarize* saf özet doğrulukları ─────────────────────────────────────
{
  const rs = summarizeRuntime(runtimeFixture());
  ok(rs.definedLogicalTests === 120 && rs.safeRunnableTests === null, '15: tanımlanan test 120, güvenli-çalıştırılabilir null (uydurulmaz).');
  const fs2 = summarizeFindings(findingsFixture());
  ok(fs2.byStatus.open === 4 && fs2.byStatus.closed === 1, '15: findings status sayıları doğru.');
  ok(fs2.openBySeverity.critical === 1 && fs2.openBySeverity.high === 1, '15: açık severity dağılımı doğru.');
}

// ── CLI (child-process): exit-code + izolasyon ───────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'exec-selfcheck-'));
function runCli(args) { return spawnSync(process.execPath, [CLI, ...args], { cwd: root, encoding: 'utf8' }); }
function writeInputs(dir, { runtime, depth, findings } = {}) {
  mkdirSync(dir, { recursive: true });
  if (runtime !== null) writeFileSync(join(dir, 'TEST-SONUCLARI.json'), JSON.stringify(runtime || runtimeFixture()));
  if (depth !== null) writeFileSync(join(dir, 'SURFACE-DEPTH.json'), JSON.stringify(depth || depthFixture()));
  if (findings !== null) writeFileSync(join(dir, 'findings.json'), JSON.stringify(findings || findingsFixture()));
}
try {
  // a) kaynak yok (boş in-dir, allow-missing YOK) → non-zero
  const emptyIn = join(tmp, 'empty-in'); mkdirSync(emptyIn, { recursive: true });
  const rA = runCli(['--in-dir', emptyIn, '--out-dir', join(tmp, 'outA')]);
  ok(rA.status !== 0, 'CLI-a: zorunlu kaynak yok → non-zero.');

  // b) geçersiz JSON → non-zero
  const badIn = join(tmp, 'bad-in'); mkdirSync(badIn, { recursive: true });
  writeFileSync(join(badIn, 'TEST-SONUCLARI.json'), '{ not json');
  writeFileSync(join(badIn, 'SURFACE-DEPTH.json'), JSON.stringify(depthFixture()));
  writeFileSync(join(badIn, 'findings.json'), JSON.stringify(findingsFixture()));
  const rB = runCli(['--in-dir', badIn, '--out-dir', join(tmp, 'outB')]);
  ok(rB.status !== 0, 'CLI-b: geçersiz JSON → non-zero.');

  // c) geçerli üç kaynak (FAIL verisi içerir) → exit 0 + 3 çıktı dosyası
  const okIn = join(tmp, 'ok-in'); writeInputs(okIn);
  const okOut = join(tmp, 'ok-out');
  const rC = runCli(['--in-dir', okIn, '--out-dir', okOut]);
  ok(rC.status === 0, `CLI-c: FAIL verisi olsa da exit 0 dönmeli. status=${rC.status} stderr=${(rC.stderr || '').slice(0, 200)}`);
  for (const f of ['YONETICI-OZET.json', 'YONETICI-OZET.md', 'YONETICI-OZET.html']) {
    ok(existsSync(join(okOut, f)), `CLI-c: ${f} üretilmeli.`);
  }

  // d) --allow-missing ile findings-only → exit 0
  const fnIn = join(tmp, 'fn-in'); mkdirSync(fnIn, { recursive: true });
  writeFileSync(join(fnIn, 'findings.json'), JSON.stringify(findingsFixture()));
  const rD = runCli(['--in-dir', fnIn, '--out-dir', join(tmp, 'outD'), '--allow-missing']);
  ok(rD.status === 0, `CLI-d: --allow-missing findings-only → exit 0. status=${rD.status}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// ── Sonuç ────────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} executive-report self-check ihlali.`);
  process.exit(1);
}
console.log(
  'Executive-report self-check geçti: 15 kütüphane sözleşmesi + 4 CLI davranışı ' +
    '(üç ayrı semantik bölüm, FAIL/FLAKY/BLOCKED/NOT_RUN gizlenmez, yanıltıcı L2-tamam yasak, ' +
    'kaynak DRIFT tespiti, provenance manşet uyarısı, INSUFFICIENT_HISTORY vs trend, kimlik/şema kapısı, ' +
    'risk boşlukları, HTML güvenlik, PII/mutlak-yol sızıntısı yok, invariant fail-closed, eksik-kaynak dürüstlüğü). ' +
    'CLI: kaynak-yok/geçersiz-JSON non-zero; FAIL verisi→exit0; allow-missing→exit0.'
);
