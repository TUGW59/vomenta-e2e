#!/usr/bin/env node
// @ts-check
/**
 * RUNTIME-REPORT SELF-CHECK — SERT KAPI (WP-MORNING Faz 2).
 *
 * `tools/runtime-report-lib.mjs` + `tools/generate-runtime-report.mjs`'in dürüstlük
 * sözleşmelerini TAMAMEN SENTETİK fixture'larla, production'a BAĞLANMADAN doğrular
 * (handoff §FAZ2 self-check matrisi 1–16). Gerçek registry/rota kullanılmaz;
 * child-process CLI testleri yalnız exit-code + izole --out-dir dosya varlığını
 * denetler (docs/raporlar'a dokunmaz).
 *
 * Çalıştır:  node tools/self-check-runtime-report.mjs  (npm run quality:runtime-report)
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  buildResultModel,
  classifyTest,
  classifyRouteStatus,
  buildBugIndex,
  renderMarkdown,
  renderHtml,
  renderResultJson,
  buildManifest,
  assertHtmlSafe,
  validateModelInvariants,
  scanOutputLeaks,
  ROUTE_STATUS,
} from './runtime-report-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = resolve(root, 'tools/generate-runtime-report.mjs');

const errors = [];
const fail = (m) => errors.push(m);
const ok = (cond, m) => { if (!cond) fail(m); };

// ── Sentetik yardımcılar (gerçek kullanıcı verisi YOK) ───────────────────────
const title = (route) => `[route:${route}] kayıtlı rota read-only baseline @smoke @route-baseline`;
const baselineTest = (status, extra = {}) => ({
  projectName: 'chromium-authed',
  expectedStatus: extra.expectedStatus || 'passed',
  annotations: extra.annotations || [],
  results: extra.results || [{ status, duration: 10 }],
});
const spec = (route, status, extra) => ({
  title: title(route),
  file: 'registered-routes-smoke.authed.spec.js',
  tags: ['@smoke', '@route-baseline'],
  tests: [baselineTest(status, extra)],
});
const reportOf = (specs) => ({ config: {}, stats: { startTime: '2026-08-02T06:00:00.000Z' }, suites: [{ title: 'root', file: 'registered-routes-smoke.authed.spec.js', specs }] });
const routes = (paths) => paths.map((p) => ({ path: p, heading: null }));
const GEN_AT = '2026-08-02T06:00:00.000Z';
const src = { commitSha: 'abc123def456', environment: 'production-read-only', browser: 'chromium', project: 'chromium-authed' };

function build(paths, specs, { testedPages, knownBugs } = {}) {
  return buildResultModel({
    registeredRoutes: routes(paths),
    testedPages: testedPages || paths.map((p) => ({ id: `pg${p}`, routes: [p], specFiles: ['registered-routes-smoke.authed.spec.js'] })),
    knownBugs: knownBugs || [],
    report: reportOf(specs),
    source: src,
    generatedAt: GEN_AT,
  });
}

// ── 1) 2 rota PASS ───────────────────────────────────────────────────────────
{
  const m = build(['/a', '/b'], [spec('/a', 'passed'), spec('/b', 'passed')]);
  ok(m.runtime.routeStatusTotals.PASS === 2, '1: iki rota PASS beklenir.');
  ok(m.pages.every((p) => p.baselineStatus === 'PASS'), '1: tüm sayfalar PASS olmalı.');
}

// ── 2) fail → page FAIL ──────────────────────────────────────────────────────
{
  const m = build(['/a', '/b'], [spec('/a', 'failed'), spec('/b', 'passed')]);
  ok(m.pages.find((p) => p.route === '/a').baselineStatus === 'FAIL', '2: /a FAIL olmalı.');
  ok(m.runtime.routeStatusTotals.FAIL === 1 && m.runtime.routeStatusTotals.PASS === 1, '2: FAIL=1 PASS=1.');
  ok(m.runtime.failedThisRun === 1, '2: failedThisRun=1.');
}

// ── 3) retry sonrası pass = FLAKY (PASS içine gizlenmez) ─────────────────────
{
  const m = build(['/a'], [spec('/a', 'passed', { results: [{ status: 'failed', duration: 5 }, { status: 'passed', duration: 6 }] })]);
  ok(m.pages[0].baselineStatus === 'FLAKY', '3: retry-pass FLAKY olmalı.');
  ok(m.runtime.flakyThisRun === 1 && m.runtime.passedThisRun === 0, '3: flakyThisRun=1, passedThisRun=0 (PASS gizlenmez).');
}

// ── 4) explicit skip/fixme = BLOCKED ─────────────────────────────────────────
{
  const m = build(['/a'], [spec('/a', 'skipped', { expectedStatus: 'skipped', annotations: [{ type: 'fixme' }], results: [{ status: 'skipped', duration: 0 }] })]);
  ok(m.pages[0].baselineStatus === 'BLOCKED', '4: skip/fixme BLOCKED olmalı.');
  ok(m.runtime.skippedThisRun === 1 && m.runtime.executedThisRun === 0, '4: skipped=1 executed=0.');
}

// ── 5) envanterde var, sonuç yok = NOT_RUN ───────────────────────────────────
{
  const m = build(['/a', '/b'], [spec('/a', 'passed')]);
  ok(m.pages.find((p) => p.route === '/b').baselineStatus === 'NOT_RUN', '5: /b NOT_RUN olmalı.');
  ok(m.runtime.routeStatusTotals.NOT_RUN === 1, '5: NOT_RUN=1.');
}

// ── 9) ambiguous/işaretsiz test birden çok rotayı PASS yapamaz ────────────────
{
  // Bir spec 2 rotaya bağlı; runtime testi İŞARETSİZ → hiçbir rota PASS olmaz.
  const testedPages = [{ id: 'combo', routes: ['/a', '/b'], specFiles: ['feature.authed.spec.js'] }];
  const unmarked = { title: 'combo feature does things', file: 'feature.authed.spec.js', tags: [], tests: [baselineTest('passed')] };
  const m = build(['/a', '/b'], [unmarked], { testedPages });
  ok(m.pages.every((p) => p.baselineStatus === 'NOT_RUN'), '9: işaretsiz test hiçbir rotayı PASS yapmamalı.');
  ok(m.unmappedTests.length === 1, '9: işaretsiz test unmappedTests altında olmalı.');
  ok(m.runtime.routeStatusTotals.PASS === 0, '9: sahte PASS üretilmemeli.');
}

// ── 10) exact route bug eşlemesi (parent/child otomatik değil) ────────────────
{
  const knownBugs = [
    { id: 'B1', route: '/a', severity: 'high', status: 'open' },
    { id: 'B2', route: '/a/child', severity: 'low', status: 'open' }, // /a kaydına EŞLEŞMEMELİ
    { id: 'B3', route: null, severity: 'medium', status: 'open' }, // unmapped
  ];
  const m = build(['/a'], [spec('/a', 'passed')], { knownBugs });
  const pageA = m.pages.find((p) => p.route === '/a');
  ok(pageA.bugs.length === 1 && pageA.bugs[0].id === 'B1', '10: yalnız exact /a bug\'ı eşlenmeli.');
  ok(m.unmappedFindings.some((f) => f.id === 'B2') && m.unmappedFindings.some((f) => f.id === 'B3'), '10: /a/child ve route\'suz bulgu unmapped olmalı.');
}

// ── 11) unmapped finding korunur (buildBugIndex) ─────────────────────────────
{
  const idx = buildBugIndex([{ id: 'X', route: '/nope', severity: 'low', status: 'open' }], ['/a']);
  ok(idx.unmappedFindings.length === 1 && idx.unmappedFindings[0].route === '/nope', '11: kayıtsız rotalı bulgu unmapped korunmalı.');
  ok(idx.totals.total === 1 && idx.totals.open === 1, '11: bug toplamları doğru.');
}

// ── 12) ham stack/stdout/stderr/attachment/absolute-path ÇIKTIYA sızmaz ───────
{
  const leaky = {
    title: title('/a'),
    file: '/Users/secretuser/repo/tests/registered-routes-smoke.authed.spec.js', // absolute → basename'e inmeli
    tags: ['@route-baseline'],
    tests: [{
      projectName: 'chromium-authed', expectedStatus: 'passed',
      results: [{
        status: 'failed', duration: 9,
        error: { message: 'boom at /Users/secretuser/x.js', stack: 'Error: boom\n    at foo (/Users/secretuser/x.js:1:1)' },
        errors: [{ message: 'boom', stack: 'at bar (/Users/secretuser/y.js:2:2)' }],
        stdout: [{ text: 'stdout /Users/secretuser/z' }], stderr: [{ text: 'stderr trace' }],
        attachments: [{ name: 'trace', path: '/Users/secretuser/trace.zip' }],
      }],
    }],
  };
  const m = build(['/a'], [leaky]);
  const blob = renderResultJson(m) + '\n' + renderMarkdown(m) + '\n' + renderHtml(m);
  const leaks = scanOutputLeaks(blob);
  ok(leaks.length === 0, `12: çıktıda sızıntı olmamalı, bulundu: ${leaks.join(',')}`);
  ok(!blob.includes('/Users/secretuser'), '12: mutlak yerel yol çıktıya sızmamalı.');
  ok(!blob.includes('at foo (') && !blob.includes('at bar ('), '12: stack izi çıktıya sızmamalı.');
  ok(m.pages[0].baselineStatus === 'FAIL', '12: leaky test yine de FAIL sınıflanmalı.');
}

// ── 13) e-posta/telefon/token sentetik değer çıktıya sızmaz ───────────────────
{
  const piiTitle = `[route:/a] baseline user test@example.com +1 415 555 0100 eyJhbGciOiJI.eyJzdWIiOiIx.abcd1234 @route-baseline`;
  const rep = reportOf([{ title: piiTitle, file: 'x.spec.js', tags: ['@route-baseline'], tests: [baselineTest('passed')] }]);
  const m = buildResultModel({ registeredRoutes: routes(['/a']), testedPages: [{ id: 'a', routes: ['/a'], specFiles: ['x.spec.js'] }], knownBugs: [], report: rep, source: src, generatedAt: GEN_AT });
  const blob = renderResultJson(m) + renderMarkdown(m) + renderHtml(m);
  const leaks = scanOutputLeaks(blob);
  ok(leaks.length === 0, `13: PII/token maskelenmeli, sızıntı: ${leaks.join(',')}`);
  ok(!blob.includes('test@example.com'), '13: e-posta maskelenmeli.');
}

// ── 14) manifest hash/size doğru + kendini hash'lemez ─────────────────────────
{
  const content = 'merhaba dünya\n';
  const man = buildManifest([{ relativePath: 'docs/raporlar/X.md', content }], GEN_AT);
  const expSize = Buffer.byteLength(content, 'utf8');
  const expHash = createHash('sha256').update(content).digest('hex');
  ok(man.files.length === 1 && man.files[0].size === expSize && man.files[0].sha256 === expHash, '14: manifest hash/size doğru olmalı.');
  ok(!man.files.some((f) => f.relativePath.includes('MANIFEST')), '14: manifest kendini hash\'lememeli.');
}

// ── 15) HTML güvenlik: script/data/blob/iframe reddi ─────────────────────────
{
  const m = build(['/a'], [spec('/a', 'passed')]);
  let threw = false;
  try { assertHtmlSafe(renderHtml(m)); } catch { threw = true; }
  ok(!threw, '15: üretilen HTML güvenli olmalı (assertHtmlSafe geçmeli).');
  for (const bad of ['<script>x</script>', '<a href="data:text/html,x">', '<iframe src="x"></iframe>', '<img src="blob:foo">', '<div onclick="x">']) {
    let caught = false;
    try { assertHtmlSafe(`<!doctype html><html><body>${bad}</body></html>`); } catch { caught = true; }
    ok(caught, `15: güvensiz HTML reddedilmeli: ${bad.slice(0, 20)}`);
  }
}

// ── 16a) FAIL varken model + render yine üretilir (kütüphane) ─────────────────
{
  const m = build(['/a', '/b'], [spec('/a', 'failed'), spec('/b', 'passed')]);
  let threw = false;
  try { renderResultJson(m); renderMarkdown(m); renderHtml(m); validateModelInvariants(m); } catch { threw = true; }
  ok(!threw, '16a: FAIL içeren model yine de tam render + invariant geçmeli.');
}

// ── classifyTest/classifyRouteStatus doğrudan birim kontrolleri ──────────────
{
  ok(classifyTest({ finalStatus: 'timedOut', expectedStatus: 'passed', attempts: 1, firstStatus: 'timedOut' }) === 'failed', 'birim: timedOut → failed.');
  ok(classifyTest({ finalStatus: 'failed', expectedStatus: 'failed', attempts: 1, firstStatus: 'failed' }) === 'knownbug', 'birim: expected-fail → knownbug.');
  ok(classifyRouteStatus([]).status === ROUTE_STATUS.NOT_RUN, 'birim: test yok → NOT_RUN.');
  // knownBugGuard beklenen-başarısızlık FAIL değil BLOCKED.
  const kb = build(['/a'], [spec('/a', 'failed', { expectedStatus: 'failed' })]);
  ok(kb.pages[0].baselineStatus === 'BLOCKED', 'birim: knownBugGuard beklenen-başarısızlık BLOCKED (FAIL değil).');
  ok(kb.runtime.routeStatusTotals.FAIL === 0, 'birim: knownBugGuard normal FAIL sayılmaz.');
}

// ── invariant ihlali fail-closed ─────────────────────────────────────────────
{
  let caught = false;
  try {
    validateModelInvariants({ inventory: { registeredRoutes: 2 }, pages: [{ route: '/a', baselineStatus: 'PASS' }], runtime: { routeStatusTotals: { PASS: 1, FAIL: 0, FLAKY: 0, BLOCKED: 0, NOT_RUN: 0 } } });
  } catch { caught = true; }
  ok(caught, 'invariant: toplam ≠ kayıtlı rota → fırlatmalı.');
}

// ── CLI (child-process): exit-code + izolasyon (docs/raporlar'a dokunmaz) ─────
const tmp = mkdtempSync(join(tmpdir(), 'rrt-selfcheck-'));
function runCli(args) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd: root, encoding: 'utf8' });
}
try {
  // 6) kaynak yok → non-zero
  const r6 = runCli(['--input', join(tmp, 'nope.json')]);
  ok(r6.status !== 0, '6: kaynak yok → non-zero olmalı.');

  // 7) geçersiz JSON → non-zero
  const badPath = join(tmp, 'bad.json');
  writeFileSync(badPath, '{ this is : not json');
  const r7 = runCli(['--input', badPath]);
  ok(r7.status !== 0, '7: geçersiz JSON → non-zero olmalı.');

  // 8) 0 seçilen test → non-zero
  const emptyPath = join(tmp, 'empty.json');
  writeFileSync(emptyPath, JSON.stringify({ config: {}, stats: {}, suites: [] }));
  const r8 = runCli(['--input', emptyPath]);
  ok(r8.status !== 0, '8: 0 seçilen test → non-zero olmalı.');

  // 16b) FAIL fixture → rapor üretilir + exit 0 (gerçek kayıtlı rota "/" kullanır)
  const failPath = join(tmp, 'fail.json');
  writeFileSync(failPath, JSON.stringify(reportOf([spec('/', 'failed')])));
  const outDir = join(tmp, 'out');
  const r16 = runCli(['--input', failPath, '--out-dir', outDir]);
  ok(r16.status === 0, `16b: FAIL varken generator exit 0 dönmeli (rapor üretir). status=${r16.status}`);
  for (const f of ['TEST-SONUCLARI.json', 'SAYFA-TEST-SONUCLARI.md', 'SABAH-KALITE-OZETI.html', 'SABAH-TESLIM-MANIFEST.json']) {
    ok(existsSync(join(outDir, f)), `16b: ${f} üretilmeli.`);
  }
  // Üretilen dosyalarda sızıntı/mutlak-yol yok.
  if (existsSync(join(outDir, 'TEST-SONUCLARI.json'))) {
    const blob = ['TEST-SONUCLARI.json', 'SAYFA-TEST-SONUCLARI.md', 'SABAH-KALITE-OZETI.html', 'SABAH-TESLIM-MANIFEST.json']
      .map((f) => readFileSync(join(outDir, f), 'utf8')).join('\n');
    ok(scanOutputLeaks(blob).length === 0, '16b: üretilen dosyalarda sızıntı olmamalı.');
  }

  // stale girdi: min-start-time gelecekte → non-zero
  const staleReport = { config: {}, stats: { startTime: '2020-01-01T00:00:00.000Z' }, suites: reportOf([spec('/', 'passed')]).suites };
  const stalePath = join(tmp, 'stale.json');
  writeFileSync(stalePath, JSON.stringify(staleReport));
  const rStale = runCli(['--input', stalePath, '--min-start-time', '2026-08-02T00:00:00.000Z', '--out-dir', join(tmp, 'out2')]);
  ok(rStale.status !== 0, 'stale: eski koşum (startTime < min) → non-zero olmalı.');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// ── Sonuç ────────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} runtime-report self-check ihlali.`);
  process.exit(1);
}
console.log(
  'Runtime-report self-check geçti: 16 sözleşme (PASS/FAIL/FLAKY/BLOCKED/NOT_RUN, ' +
    'source-missing/invalid-JSON/0-selected/stale non-zero, ambiguous→no-fake-PASS, exact bug map, ' +
    'PII/stack/absolute-path sızıntısı yok, manifest hash, HTML güvenlik, FAIL→rapor+exit0). ' +
    'Generator exit semantiği: FAIL raporu üretir→exit0; kaynak/şema/0-test/sızıntı/stale→non-zero.'
);
