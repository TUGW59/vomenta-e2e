// @ts-check
/**
 * WP-MORNING Faz 2 — GERÇEK RUNTIME RAPORLAMA MOTORU (saf kütüphane).
 *
 * Playwright'ın GERÇEK JSON koşum sonucunu (statik `--list` DEĞİL) kayıtlı rota
 * envanteri + bilinen bug registry ile birleştirip yönetici-okur HTML/MD + makine
 * -okur JSON + güvenli manifest üretir. Bu dosya YALNIZ saf fonksiyon içerir:
 * dosya sistemi/CLI yan etkisi yoktur → `self-check-runtime-report.mjs` tümünü
 * sentetik fixture'larla, production'a bağlanmadan doğrular.
 *
 * DÜRÜSTLÜK SÖZLEŞMELERİ (HANDOFF §3.3 / §4):
 * - Rota nihai durumu YALNIZ {PASS, FAIL, FLAKY, BLOCKED, NOT_RUN}'dan biridir ve
 *   toplamları kayıtlı rota sayısına EŞİTTİR (buildResultModel invariant doğrular).
 * - Bir testin sonucu bir rotaya YALNIZ exact `[route:/x]` işaretiyle bağlanır;
 *   işaretsiz/çok-anlamlı test HİÇBİR rotayı yeşile çeviremez (unmappedTests).
 * - retry-pass = FLAKY (PASS içine gizlenmez). knownBugGuard expected-fail normal
 *   FAIL sayılmaz (BLOCKED + uyarı olarak ayrılır).
 * - Ham hata mesajı/stack/stdout/stderr/attachment yolu/mutlak yol raporlara
 *   ASLA taşınmaz; yalnız deterministik güvenli hata sınıfı + sanitize edilmiş
 *   başlık kalır (findSecrets ile sızıntı kapısı).
 */
import { basename } from 'node:path';
import { createHash } from 'node:crypto';
import { findSecrets, redactText } from '../tests/fixtures/sanitize.js';
import { parseRouteMarker } from '../tests/contracts/registered-routes.js';

export const SCHEMA_VERSION = 1;

/** Kanonik rota nihai durumları (toplamı = kayıtlı rota sayısı). */
export const ROUTE_STATUS = Object.freeze({
  PASS: 'PASS',
  FAIL: 'FAIL',
  FLAKY: 'FLAKY',
  BLOCKED: 'BLOCKED',
  NOT_RUN: 'NOT_RUN',
});
export const ROUTE_STATUS_ORDER = Object.freeze(['PASS', 'FAIL', 'FLAKY', 'BLOCKED', 'NOT_RUN']);

/**
 * Kanonik runtime sonuç sözlüğü (HANDOFF §3.3 — 7 durum). İlk 5'i rota-düzeyi
 * nihai durumdur (toplamı = kayıtlı rota); son 2'si AYRI semantiktir:
 * EXPECTED_KNOWN_BUG = knownBugGuard beklenen-başarısızlık (normal FAIL DEĞİL),
 * SKIPPED_BY_POLICY = seçim politikasıyla dışlanan (mutation/external-cost →
 * koşuma HİÇ girmez, JSON'da görünmez; manifestten türer). Bu sözlük raporun
 * durum kelime dağarcığının TAM olduğunu belgeler; sahte durum icat edilmez.
 */
export const TEST_STATUS = Object.freeze({
  PASS: 'PASS',
  FAIL: 'FAIL',
  FLAKY: 'FLAKY',
  BLOCKED: 'BLOCKED',
  NOT_RUN: 'NOT_RUN',
  EXPECTED_KNOWN_BUG: 'EXPECTED_KNOWN_BUG',
  SKIPPED_BY_POLICY: 'SKIPPED_BY_POLICY',
});

/** Güvenli, deterministik hata sınıfı (ham mesaj/stack ASLA emit edilmez). */
export function safeErrorClass(status) {
  switch (String(status)) {
    case 'passed':
      return 'passed';
    case 'failed':
      return 'failed';
    case 'timedOut':
      return 'timeout';
    case 'interrupted':
      return 'interrupted';
    case 'skipped':
      return 'skipped';
    default:
      return 'unknown';
  }
}

/**
 * Playwright run JSON'unu güvenli, düz test kayıtlarına indirger. Yalnız düşük
 * -riskli, teşhis için zorunlu alanlar tutulur; error.message/stack, stdout/stderr,
 * attachment path, annotation açıklaması ve absolute path ÇIKARILIR. Başlık +
 * proje sanitize edilerek re-emit edilir.
 *
 * @param {any} report Playwright JSON reporter çıktısı ({ suites:[...] }).
 * @returns {{file:string,title:string,routeMarker:string|null,project:string,expectedStatus:string,finalStatus:string,firstStatus:string,attempts:number,durationMs:number|null,skipReason:string,tags:string[]}[]}
 */
export function flattenRuntimeTests(report) {
  const out = [];
  const walk = (suite) => {
    for (const spec of suite.specs || []) {
      const tags = (spec.tags || []).map((t) => String(t).replace(/^@/, ''));
      const routeMarker = parseRouteMarker(`${suite.title || ''} ${spec.title || ''}`);
      for (const t of spec.tests || []) {
        const results = t.results || [];
        const last = results[results.length - 1] || {};
        const annotations = t.annotations || [];
        // Yalnız annotation TÜRÜ (skip/fixme) tutulur; açıklama metni raporlara girmez.
        const skipAnno = annotations.find((a) => a && (a.type === 'skip' || a.type === 'fixme'));
        out.push({
          file: basename(String(spec.file || '')),
          title: redactText(String(spec.title || '')).slice(0, 300),
          routeMarker,
          project: redactText(String(t.projectName || t.projectId || '')).slice(0, 60),
          expectedStatus: String(t.expectedStatus || 'unknown'),
          finalStatus: String(last.status || 'unknown'),
          firstStatus: String((results[0] && results[0].status) || last.status || 'unknown'),
          attempts: results.length || 0,
          durationMs: results.reduce((s, r) => s + (Number(r && r.duration) || 0), 0) || null,
          skipReason: skipAnno ? skipAnno.type : '',
          tags,
        });
      }
    }
    for (const child of suite.suites || []) walk(child);
  };
  for (const s of (report && report.suites) || []) walk(s);
  return out;
}

/**
 * Tek testin nihai lensini döndürür (rota toplamları DEĞİL, run toplamları için).
 * @returns {'passed'|'failed'|'flaky'|'skipped'|'knownbug'}
 */
export function classifyTest(rec) {
  const s = rec.finalStatus;
  if (s === 'skipped') return 'skipped';
  const expectedFail = rec.expectedStatus === 'failed';
  const failed = s === 'failed' || s === 'timedOut' || s === 'interrupted';
  if (expectedFail && failed) return 'knownbug'; // knownBugGuard: beklenen başarısızlık
  if (failed) return 'failed';
  if (s === 'passed') {
    if (rec.attempts > 1 && rec.firstStatus !== 'passed') return 'flaky';
    return 'passed';
  }
  return 'failed'; // bilinmeyen/interrupted güvenli tarafta FAIL
}

/**
 * Bir rotaya (exact işaretle) eşlenen testlerden kanonik rota durumunu türetir.
 * Önem sırası: FAIL > FLAKY > BLOCKED(all-skipped/knownbug) > PASS. Test yoksa
 * NOT_RUN. knownBugGuard beklenen-başarısızlık FAIL sayılmaz → BLOCKED + uyarı.
 *
 * @param {ReturnType<typeof flattenRuntimeTests>} tests bu rotaya eşlenen testler
 * @returns {{status:string, reason:string}}
 */
export function classifyRouteStatus(tests) {
  if (!tests.length) return { status: ROUTE_STATUS.NOT_RUN, reason: 'inventory-only' };
  const lenses = tests.map(classifyTest);
  if (lenses.includes('failed')) return { status: ROUTE_STATUS.FAIL, reason: 'unexpected-failure' };
  if (lenses.includes('flaky')) return { status: ROUTE_STATUS.FLAKY, reason: 'retry-pass' };
  if (lenses.includes('passed')) return { status: ROUTE_STATUS.PASS, reason: 'passed' };
  // Kalan: yalnız skipped ve/veya knownbug.
  if (lenses.includes('knownbug')) {
    return { status: ROUTE_STATUS.BLOCKED, reason: 'known-bug-expected-failure' };
  }
  return { status: ROUTE_STATUS.BLOCKED, reason: 'skipped-or-fixme' };
}

/**
 * TESTED_PAGES sözleşmelerinden rota → { pageIds, contractSpecFiles } indeksi.
 * @param {ReadonlyArray<{id:string,routes?:ReadonlyArray<string>,specFiles?:ReadonlyArray<string>}>} pages
 */
export function buildRouteContractIndex(pages) {
  /** @type {Map<string,{pageIds:string[],specFiles:Set<string>}>} */
  const idx = new Map();
  for (const p of pages) {
    for (const route of p.routes || []) {
      if (!idx.has(route)) idx.set(route, { pageIds: [], specFiles: new Set() });
      const e = idx.get(route);
      if (!e.pageIds.includes(p.id)) e.pageIds.push(p.id);
      for (const f of p.specFiles || []) e.specFiles.add(f);
    }
  }
  return idx;
}

/**
 * Known-bug registry özetini ve rota-eşlemesini üretir. Yalnız EXACT
 * `bug.route === route` eşlemesi (parent/child otomatik eşleşmez, §4.4).
 *
 * @param {ReadonlyArray<{id:string,route?:string|null,severity:string,status:string}>} bugs
 * @param {ReadonlyArray<string>} registeredRoutePaths
 */
export function buildBugIndex(bugs, registeredRoutePaths) {
  const registered = new Set(registeredRoutePaths);
  /** @type {Map<string,{id:string,severity:string,status:string}[]>} */
  const byRoute = new Map();
  const unmappedFindings = [];
  const totals = { total: 0, open: 0, fixedCandidate: 0, closed: 0 };
  for (const b of bugs) {
    totals.total++;
    if (b.status === 'open') totals.open++;
    else if (b.status === 'fixed-candidate') totals.fixedCandidate++;
    else if (b.status === 'closed') totals.closed++;
    const safe = { id: String(b.id), severity: String(b.severity), status: String(b.status) };
    if (b.route && registered.has(b.route)) {
      if (!byRoute.has(b.route)) byRoute.set(b.route, []);
      byRoute.get(b.route).push(safe);
    } else {
      unmappedFindings.push({ ...safe, route: b.route ? String(b.route) : null });
    }
  }
  return { byRoute, unmappedFindings, totals };
}

/** Run-geneli test toplamları (rota toplamlarından AYRI lens, §4.2). */
export function buildRuntimeTotals(tests) {
  const t = {
    selectedThisRun: tests.length,
    executedThisRun: 0,
    passedThisRun: 0,
    failedThisRun: 0,
    flakyThisRun: 0,
    skippedThisRun: 0,
    knownBugExpectedFail: 0,
  };
  for (const rec of tests) {
    const lens = classifyTest(rec);
    if (lens !== 'skipped') t.executedThisRun++;
    if (lens === 'passed') t.passedThisRun++;
    else if (lens === 'failed') t.failedThisRun++;
    else if (lens === 'flaky') t.flakyThisRun++;
    else if (lens === 'skipped') t.skippedThisRun++;
    else if (lens === 'knownbug') t.knownBugExpectedFail++;
  }
  return t;
}

/**
 * TAM sonuç modelini kurar. Rota durumu YALNIZ exact `[route:]` işaretli testlerden
 * türetilir; işaretsiz/kayıtsız-işaretli testler unmappedTests'e düşer (sahte PASS
 * engeli). Rota toplamları invariant'ı doğrulanır; ihlal → fırlatır.
 *
 * @param {object} opts
 * @param {ReadonlyArray<{path:string,heading:string|null}>} opts.registeredRoutes
 * @param {ReadonlyArray<{id:string,routes?:ReadonlyArray<string>,specFiles?:ReadonlyArray<string>}>} opts.testedPages
 * @param {ReadonlyArray<{id:string,route?:string|null,severity:string,status:string}>} opts.knownBugs
 * @param {any} opts.report Playwright run JSON
 * @param {object} opts.source { commitSha, environment, browser, project?, runId?, inputPath?, runStartedAt? }
 * @param {string} opts.generatedAt ISO zaman (deterministik test için dışarıdan)
 * @param {object} [opts.listInventory] { definedLogical, projectExpandedListed, runnableInventory } | null
 * @param {object} [opts.manifestCounts] FAZ 1 read-only manifest sayıları
 *   { totalSpecs, productionSafeReadOnly, stagingRequired, externalCostExcluded } | null.
 *   §3.2 "production-safe seçilebilir" / "staging gerektiren" sütunlarını uydurmadan besler.
 */
export function buildResultModel(opts) {
  const {
    registeredRoutes,
    testedPages,
    knownBugs,
    report,
    source,
    generatedAt,
    listInventory = null,
    manifestCounts = null,
  } = opts;

  const warnings = [];
  const registeredPaths = registeredRoutes.map((r) => r.path);
  const tests = flattenRuntimeTests(report);

  // İşarete göre grupla. Kayıtsız rota işareti = uyarı; hiçbir sayfayı etkilemez.
  const registeredSet = new Set(registeredPaths);
  /** @type {Map<string, typeof tests>} */
  const byRoute = new Map();
  const unmappedTests = [];
  for (const rec of tests) {
    const m = rec.routeMarker;
    if (m && registeredSet.has(m)) {
      if (!byRoute.has(m)) byRoute.set(m, []);
      byRoute.get(m).push(rec);
    } else {
      if (m && !registeredSet.has(m)) {
        warnings.push(`Kayıtsız rota işareti (sayfa durumuna sayılmadı): ${m}`);
      }
      unmappedTests.push({
        file: rec.file,
        title: rec.title,
        project: rec.project,
        status: rec.finalStatus,
        errorClass: safeErrorClass(rec.finalStatus),
        routeMarker: rec.routeMarker || null,
      });
    }
  }

  const contractIdx = buildRouteContractIndex(testedPages);
  const bugIdx = buildBugIndex(knownBugs, registeredPaths);

  const totals = { PASS: 0, FAIL: 0, FLAKY: 0, BLOCKED: 0, NOT_RUN: 0 };
  const pages = registeredRoutes.map((route) => {
    const routeTests = byRoute.get(route.path) || [];
    const { status, reason } = classifyRouteStatus(routeTests);
    totals[status]++;
    if (reason === 'known-bug-expected-failure') {
      warnings.push(`Rota ${route.path}: route-baseline testi knownBugGuard beklenen-başarısızlık taşıyor → BLOCKED.`);
    }
    // Sayfa-içi test sayaçları (lens bazlı).
    const lensCounts = { passed: 0, failed: 0, flaky: 0, skipped: 0, knownbug: 0 };
    for (const rt of routeTests) lensCounts[classifyTest(rt)]++;
    const contract = contractIdx.get(route.path) || { pageIds: [], specFiles: new Set() };
    return {
      route: route.path,
      heading: route.heading,
      pageIds: contract.pageIds.slice().sort(),
      baselineStatus: status,
      statusReason: reason,
      selected: routeTests.length,
      executed: routeTests.filter((r) => classifyTest(r) !== 'skipped').length,
      passed: lensCounts.passed,
      failed: lensCounts.failed,
      flaky: lensCounts.flaky,
      skipped: lensCounts.skipped,
      knownBugExpectedFail: lensCounts.knownbug,
      durationMs: routeTests.reduce((s, r) => s + (r.durationMs || 0), 0) || null,
      specFiles: [...contract.specFiles].sort(),
      bugs: (bugIdx.byRoute.get(route.path) || []).slice().sort((a, b) => a.id.localeCompare(b.id)),
    };
  });

  const runtimeTotals = buildRuntimeTotals(tests);
  // Gözlemlenen yürütme kanıtı: toplam gerçek `results` denemesi. 0 ise girdi
  // yalnız-listelenmiş (`--list`) demektir → provenance runtime sayamaz.
  const observedAttempts = tests.reduce((s, t) => s + (Number(t.attempts) || 0), 0);
  const skippedByPolicy =
    manifestCounts && Number.isFinite(manifestCounts.totalSpecs) && Number.isFinite(manifestCounts.productionSafeReadOnly)
      ? manifestCounts.totalSpecs - manifestCounts.productionSafeReadOnly
      : null;

  const model = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    source: {
      sourceType: source.sourceType ? String(source.sourceType).slice(0, 40) : null,
      commitSha: source.commitSha ? String(source.commitSha).slice(0, 40).replace(/[^a-f0-9]/gi, '') || null : null,
      environment: String(source.environment || 'production-read-only'),
      browser: String(source.browser || 'chromium'),
      project: source.project ? String(source.project).slice(0, 60) : null,
      runId: source.runId ? String(source.runId).slice(0, 32).replace(/[^0-9]/g, '') || null : null,
      inputPath: source.inputPath ? basename(String(source.inputPath)) : null,
      runStartedAt: source.runStartedAt || null,
    },
    inventory: {
      registeredRoutes: registeredRoutes.length,
      testedPagesContracts: testedPages.length,
      knownBugs: {
        total: bugIdx.totals.total,
        open: bugIdx.totals.open,
        fixedCandidate: bugIdx.totals.fixedCandidate,
        closed: bugIdx.totals.closed,
        unmappedFindings: bugIdx.unmappedFindings.length,
      },
      // Statik envanter (opsiyonel kaynak). Yoksa uydurulmaz → null + not.
      definedLogical: listInventory && Number.isFinite(listInventory.definedLogical) ? listInventory.definedLogical : null,
      projectExpandedListed: listInventory && Number.isFinite(listInventory.projectExpandedListed) ? listInventory.projectExpandedListed : null,
      runnableInventory: listInventory && Number.isFinite(listInventory.runnableInventory) ? listInventory.runnableInventory : null,
      listInventorySource: listInventory ? 'provided' : 'not-provided',
      // FAZ 1 read-only manifest sayıları (§3.2 ayrı sütunlar). Yoksa null (uydurma yok).
      manifestTotalSpecs: manifestCounts && Number.isFinite(manifestCounts.totalSpecs) ? manifestCounts.totalSpecs : null,
      productionSafeSelectable: manifestCounts && Number.isFinite(manifestCounts.productionSafeReadOnly) ? manifestCounts.productionSafeReadOnly : null,
      stagingRequired: manifestCounts && Number.isFinite(manifestCounts.stagingRequired) ? manifestCounts.stagingRequired : null,
      // SKIPPED_BY_POLICY (§3.3): seçim politikasıyla dışlanan spec sayısı = tanımlı
      // − production-safe (mutation/external-cost). Manifest yoksa null (uydurma yok).
      skippedByPolicy,
      manifestCountsSource: manifestCounts ? 'provided' : 'not-provided',
    },
    runtime: {
      ...runtimeTotals,
      observedAttempts,
      routeStatusTotals: totals,
      // Kanonik §3.3 sözlüğü tek görünümde: ilk 5 rota-düzeyi, son 2 ayrı semantik.
      canonical: {
        PASS: totals.PASS,
        FAIL: totals.FAIL,
        FLAKY: totals.FLAKY,
        BLOCKED: totals.BLOCKED,
        NOT_RUN: totals.NOT_RUN,
        EXPECTED_KNOWN_BUG: runtimeTotals.knownBugExpectedFail,
        SKIPPED_BY_POLICY: skippedByPolicy,
      },
    },
    // Trend/delta için stabil başarısız-test anahtarları (§item12). Sanitize edilmiş
    // rota + unmapped test kimlikleri; ham içerik yok. report-history bunu tüketir.
    failingTestKeys: [
      ...pages.filter((p) => p.baselineStatus === 'FAIL').map((p) => `route:${p.route}`),
      ...unmappedTests.filter((u) => u.errorClass === 'failed' || u.errorClass === 'timeout').map((u) => `test:${u.file}::${u.title}`),
    ].sort(),
    pages,
    unmappedTests,
    unmappedFindings: bugIdx.unmappedFindings,
    warnings,
  };

  validateModelInvariants(model);
  return model;
}

/** Toplam invariant + tekillik denetimi; ihlal → Error (fail-closed). */
export function validateModelInvariants(model) {
  const errors = [];
  const routeCount = model.inventory.registeredRoutes;
  if (model.pages.length !== routeCount) {
    errors.push(`pages.length (${model.pages.length}) ≠ kayıtlı rota (${routeCount}).`);
  }
  const seen = new Set();
  for (const p of model.pages) {
    if (seen.has(p.route)) errors.push(`Rota birden çok satırda: ${p.route}`);
    seen.add(p.route);
    if (!ROUTE_STATUS_ORDER.includes(p.baselineStatus)) {
      errors.push(`Geçersiz rota durumu: ${p.route} → ${p.baselineStatus}`);
    }
  }
  const t = model.runtime.routeStatusTotals;
  const sum = t.PASS + t.FAIL + t.FLAKY + t.BLOCKED + t.NOT_RUN;
  if (sum !== routeCount) {
    errors.push(`Rota durum toplamı (${sum}) ≠ kayıtlı rota (${routeCount}).`);
  }
  if (errors.length) {
    const err = new Error('Runtime model invariant ihlali:\n  - ' + errors.join('\n  - '));
    err.name = 'RuntimeModelInvariantError';
    throw err;
  }
  return true;
}

// ── Render: Markdown (repo source-of-truth) ──────────────────────────────────
function mdCell(v) {
  return String(v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}
const STATUS_BADGE = { PASS: '✅ PASS', FAIL: '❌ FAIL', FLAKY: '🟡 FLAKY', BLOCKED: '⛔ BLOCKED', NOT_RUN: '⚪ NOT_RUN' };

/** SAYFA-TEST-SONUCLARI.md — yönetici tablosu (FAIL/BLOCKED/NOT_RUN önce). */
export function renderMarkdown(model) {
  const t = model.runtime.routeStatusTotals;
  const rt = model.runtime;
  const L = [];
  L.push('# Vomenta — Sayfa Test Sonuçları (Sabah Read-only Koşumu)');
  L.push('');
  L.push('> ⚙️ **Otomatik üretilir** (`npm run report:runtime`). Kaynak: Playwright **gerçek koşum** JSON raporu (statik `--list` DEĞİL).');
  L.push(`> **Kanıt:** commit \`${model.source.commitSha || '—'}\` · ortam \`${model.source.environment}\` · tarayıcı \`${model.source.browser}\`` +
    `${model.source.project ? ` · proje \`${model.source.project}\`` : ''}${model.source.runId ? ` · run \`${model.source.runId}\`` : ''} · üretim \`${model.generatedAt}\``);
  L.push('');
  L.push('## Rota durum özeti');
  L.push('');
  L.push(`- **Kayıtlı rota:** ${model.inventory.registeredRoutes} · sözleşme sayfası: ${model.inventory.testedPagesContracts}`);
  L.push(`- **PASS** ${t.PASS} · **FAIL** ${t.FAIL} · **FLAKY** ${t.FLAKY} · **BLOCKED** ${t.BLOCKED} · **NOT_RUN** ${t.NOT_RUN}  _(toplam ${t.PASS + t.FAIL + t.FLAKY + t.BLOCKED + t.NOT_RUN})_`);
  L.push(`- **Koşum:** seçilen ${rt.selectedThisRun} · çalışan ${rt.executedThisRun} · geçen ${rt.passedThisRun} · başarısız ${rt.failedThisRun} · flaky ${rt.flakyThisRun} · atlanan ${rt.skippedThisRun}` +
    `${rt.knownBugExpectedFail ? ` · known-bug-expected-fail ${rt.knownBugExpectedFail}` : ''}`);
  // §3.2 — birbirine KARIŞTIRILMAYAN sayılar (yoksa "—", uydurma yok).
  const inv = model.inventory;
  const nOrDash = (v) => (v == null ? '—' : String(v));
  L.push(
    `- **Kapsam hunisi (ayrı semantik):** tanımlı ${nOrDash(inv.definedLogical ?? inv.manifestTotalSpecs)} → ` +
      `production-safe seçilebilir ${nOrDash(inv.productionSafeSelectable)} → bu koşumda seçilen ${rt.selectedThisRun} → ` +
      `gerçekten çalışan ${rt.executedThisRun}  ·  staging gerektiren ${nOrDash(inv.stagingRequired)}` +
      `  ·  politikayla dışlanan (SKIPPED_BY_POLICY) ${nOrDash(inv.skippedByPolicy)}  ·  EXPECTED_KNOWN_BUG ${rt.knownBugExpectedFail}`
  );
  L.push('- ℹ️ **`listed != selected != executed != passed`** — bu sayılar aynı şey DEĞİLDİR; her biri ayrı kapsam katmanıdır.');
  L.push(`- **Bilinen bulgu:** ${model.inventory.knownBugs.total} (open ${model.inventory.knownBugs.open} · fixed-candidate ${model.inventory.knownBugs.fixedCandidate} · closed ${model.inventory.knownBugs.closed})`);
  if (rt.knownBugExpectedFail === 0 && t.NOT_RUN === 0 && rt.selectedThisRun === model.inventory.registeredRoutes) {
    L.push('- ✅ Her kayıtlı rota için tam 1 baseline testi seçildi ve NOT_RUN=0.');
  }
  L.push('');
  L.push('## Bu rapor neyi kanıtlar / ne kanıtlamaz');
  L.push('');
  L.push('- **Kanıtlar:** kayıtlı her rotanın sabah koşumundaki read-only açılış (erişim/URL/temel yüzey) sonucu; gerçek çalıştırılan test sayısı; FAIL/BLOCKED/NOT_RUN gizlenmeden.');
  L.push('- **Kanıtlamaz:** derin fonksiyon kapsamı, mutation/RBAC/dış-servis senaryoları (staging bekler), cross-browser/visual. Sayfa PASS = "tam fonksiyon kapsamı" DEĞİL.');
  L.push('');

  const bad = model.pages.filter((p) => p.baselineStatus === 'FAIL' || p.baselineStatus === 'BLOCKED' || p.baselineStatus === 'NOT_RUN' || p.baselineStatus === 'FLAKY');
  if (bad.length) {
    L.push('## Dikkat gerektiren rotalar (FAIL / FLAKY / BLOCKED / NOT_RUN)');
    L.push('');
    L.push('| rota | durum | neden | çalışan | spec dosyaları | bulgular |');
    L.push('|---|---|---|---|---|---|');
    for (const p of bad) {
      L.push(`| ${mdCell(p.route)} | ${STATUS_BADGE[p.baselineStatus]} | ${mdCell(p.statusReason)} | ${p.executed} | ${mdCell(p.specFiles.join(' '))} | ${mdCell(p.bugs.map((b) => `${b.id}(${b.severity}/${b.status})`).join(' '))} |`);
    }
    L.push('');
  }

  L.push('## Tüm kayıtlı rotalar');
  L.push('');
  L.push('| rota | sözleşme | durum | seçilen | çalışan | geçen | başarısız | flaky | atlanan | süre(ms) | bulgular |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const p of model.pages) {
    L.push(
      `| ${mdCell(p.route)} | ${mdCell(p.pageIds.join(','))} | ${STATUS_BADGE[p.baselineStatus]} | ${p.selected} | ${p.executed} | ${p.passed} | ${p.failed} | ${p.flaky} | ${p.skipped} | ${p.durationMs ?? ''} | ${mdCell(p.bugs.map((b) => b.id).join(' '))} |`
    );
  }
  L.push('');

  L.push('## Bulgu özeti (severity × status)');
  L.push('');
  L.push(`- Toplam ${model.inventory.knownBugs.total} · open ${model.inventory.knownBugs.open} · fixed-candidate ${model.inventory.knownBugs.fixedCandidate} · closed ${model.inventory.knownBugs.closed}`);
  L.push(`- Rotaya bağlanamayan bulgu (unmappedFindings): ${model.unmappedFindings.length}`);
  if (model.unmappedTests.length) {
    L.push(`- Rotaya eşlenmeyen test sonucu (unmappedTests): ${model.unmappedTests.length} — sayfa durumuna SAYILMAZ (sahte PASS engeli).`);
  }
  L.push('');
  if (model.warnings.length) {
    L.push('## Uyarılar');
    L.push('');
    for (const w of model.warnings) L.push(`- ${mdCell(w)}`);
    L.push('');
  }
  return L.join('\n');
}

// ── Render: HTML (kendi kendine yeten, script/data/blob/iframe YOK) ───────────
function htmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
const HTML_STATUS_CLASS = { PASS: 'pass', FAIL: 'fail', FLAKY: 'flaky', BLOCKED: 'blocked', NOT_RUN: 'notrun' };

/** SABAH-KALITE-OZETI.html — yazdırılabilir, dış-kaynaksız yönetici özeti. */
export function renderHtml(model) {
  const t = model.runtime.routeStatusTotals;
  const rt = model.runtime;
  const kb = model.inventory.knownBugs;
  const card = (label, value, cls = '') => `<div class="card ${cls}"><div class="n">${htmlEscape(String(value))}</div><div class="l">${htmlEscape(label)}</div></div>`;
  const rows = model.pages
    .map(
      (p) =>
        `<tr class="${HTML_STATUS_CLASS[p.baselineStatus]}"><td>${htmlEscape(p.route)}</td>` +
        `<td>${htmlEscape(p.pageIds.join(','))}</td>` +
        `<td><span class="badge ${HTML_STATUS_CLASS[p.baselineStatus]}">${htmlEscape(p.baselineStatus)}</span></td>` +
        `<td class="num">${p.executed}</td><td class="num">${p.passed}</td><td class="num">${p.failed}</td>` +
        `<td class="num">${p.flaky}</td><td class="num">${p.skipped}</td>` +
        `<td class="num">${p.durationMs == null ? '' : htmlEscape(String(p.durationMs))}</td>` +
        `<td>${htmlEscape(p.bugs.map((b) => `${b.id}(${b.severity})`).join(' '))}</td></tr>`
    )
    .join('\n');
  const warnHtml = model.warnings.length
    ? `<h2>Uyarılar</h2><ul>${model.warnings.map((w) => `<li>${htmlEscape(w)}</li>`).join('')}</ul>`
    : '';
  const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vomenta — Sabah Kalite Özeti</title>
<style>
  :root{--ink:#1a2432;--muted:#55606e;--line:#d9dee4;--bg:#fff;--panel:#f6f8fa;--pass:#1a7f4b;--fail:#c02626;--flaky:#b8860b;--blocked:#5b4b8a;--notrun:#6b7280}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
  main{max-width:66rem;margin:0 auto;padding:2rem 1.5rem 3rem}
  h1{font-size:1.7rem;margin:.2rem 0 .3rem}
  h2{font-size:1.2rem;margin:1.6rem 0 .5rem;border-bottom:1px solid var(--line);padding-bottom:.25rem}
  .sub{color:var(--muted);margin:.1rem 0 1rem;font-size:.85rem}
  .cards{display:flex;flex-wrap:wrap;gap:.6rem;margin:.6rem 0 1rem}
  .card{border:1px solid var(--line);border-radius:8px;padding:.6rem .9rem;min-width:6.2rem;background:var(--panel)}
  .card .n{font-size:1.5rem;font-weight:700}
  .card .l{font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.03em}
  .card.pass .n{color:var(--pass)}.card.fail .n{color:var(--fail)}.card.flaky .n{color:var(--flaky)}
  .card.blocked .n{color:var(--blocked)}.card.notrun .n{color:var(--notrun)}
  table{border-collapse:collapse;width:100%;margin:.6rem 0;font-size:.8rem}
  th,td{border:1px solid var(--line);padding:.3rem .45rem;text-align:left;vertical-align:top}
  th{background:var(--panel);font-weight:600}
  td.num{text-align:right;font-variant-numeric:tabular-nums}
  .badge{display:inline-block;padding:.05rem .4rem;border-radius:4px;font-size:.72rem;font-weight:600;color:#fff}
  .badge.pass{background:var(--pass)}.badge.fail{background:var(--fail)}.badge.flaky{background:var(--flaky)}
  .badge.blocked{background:var(--blocked)}.badge.notrun{background:var(--notrun)}
  tr.fail td:first-child,tr.notrun td:first-child{font-weight:600}
  ul{color:var(--muted)}
  .proves{display:flex;flex-wrap:wrap;gap:1rem;margin:.4rem 0}
  .proves>div{flex:1;min-width:16rem;border:1px solid var(--line);border-radius:8px;padding:.7rem .9rem}
  @page{margin:14mm}
</style></head><body><main>
<h1>Vomenta — Sabah Kalite Özeti</h1>
<p class="sub">Playwright gerçek read-only koşumu · commit ${htmlEscape(model.source.commitSha || '—')} · ortam ${htmlEscape(model.source.environment)} · tarayıcı ${htmlEscape(model.source.browser)}${model.source.project ? ' · proje ' + htmlEscape(model.source.project) : ''}${model.source.runId ? ' · run ' + htmlEscape(model.source.runId) : ''} · üretim ${htmlEscape(model.generatedAt)}</p>
<div class="cards">
${card('Kayıtlı rota', model.inventory.registeredRoutes)}
${card('PASS', t.PASS, 'pass')}
${card('FAIL', t.FAIL, 'fail')}
${card('FLAKY', t.FLAKY, 'flaky')}
${card('BLOCKED', t.BLOCKED, 'blocked')}
${card('NOT_RUN', t.NOT_RUN, 'notrun')}
${card('Açık bulgu', kb.open)}
</div>
<div class="proves">
  <div><strong>Bu rapor neyi kanıtlar:</strong> kayıtlı ${htmlEscape(String(model.inventory.registeredRoutes))} rotanın sabah koşumundaki read-only açılış sonucu; gerçek çalışan test sayısı (${htmlEscape(String(rt.executedThisRun))}/${htmlEscape(String(rt.selectedThisRun))}); FAIL/BLOCKED/NOT_RUN gizlenmeden.</div>
  <div><strong>Ne kanıtlamaz:</strong> derin fonksiyon kapsamı, mutation/RBAC/dış-servis (staging bekler), cross-browser/visual. Sayfa PASS = tam fonksiyon kapsamı değildir.</div>
</div>
<h2>Koşum sayıları</h2>
<p class="sub">seçilen ${htmlEscape(String(rt.selectedThisRun))} · çalışan ${htmlEscape(String(rt.executedThisRun))} · geçen ${htmlEscape(String(rt.passedThisRun))} · başarısız ${htmlEscape(String(rt.failedThisRun))} · flaky ${htmlEscape(String(rt.flakyThisRun))} · atlanan ${htmlEscape(String(rt.skippedThisRun))}${rt.knownBugExpectedFail ? ' · known-bug-expected-fail ' + htmlEscape(String(rt.knownBugExpectedFail)) : ''}</p>
<h2>Kayıtlı rotalar (${htmlEscape(String(model.pages.length))})</h2>
<table><thead><tr><th>Rota</th><th>Sözleşme</th><th>Durum</th><th>Çalışan</th><th>Geçen</th><th>Başarısız</th><th>Flaky</th><th>Atlanan</th><th>ms</th><th>Bulgular</th></tr></thead>
<tbody>
${rows}
</tbody></table>
<h2>Bulgu özeti</h2>
<p class="sub">Toplam ${htmlEscape(String(kb.total))} · open ${htmlEscape(String(kb.open))} · fixed-candidate ${htmlEscape(String(kb.fixedCandidate))} · closed ${htmlEscape(String(kb.closed))} · rotaya bağlanamayan ${htmlEscape(String(model.unmappedFindings.length))}</p>
${warnHtml}
</main></body></html>
`;
  assertHtmlSafe(html);
  return html;
}

/**
 * HTML güvenlik kapısı: script / data: / blob: / iframe / dış istek YOK. Üretim
 * içi self-check hem burada hem self-check-runtime-report'ta çalışır.
 * @param {string} html
 */
export function assertHtmlSafe(html) {
  const s = String(html);
  const forbidden = [
    { re: /<script\b/i, name: '<script>' },
    { re: /<iframe\b/i, name: '<iframe>' },
    { re: /\bdata:/i, name: 'data: URI' },
    { re: /\bblob:/i, name: 'blob: URI' },
    { re: /\bon[a-z]+\s*=\s*["']/i, name: 'inline event handler' },
    { re: /<link\b[^>]*rel=["']?stylesheet/i, name: 'external stylesheet' },
    { re: /\b(?:src|href)\s*=\s*["']https?:/i, name: 'external http(s) resource' },
  ];
  const hits = forbidden.filter((f) => f.re.test(s)).map((f) => f.name);
  if (hits.length) {
    const err = new Error(`HTML güvenlik ihlali: ${hits.join(', ')}`);
    err.name = 'HtmlSafetyError';
    throw err;
  }
  const leaks = findSecrets(s);
  if (leaks.length) {
    const err = new Error(`HTML secret/PII sızıntısı: ${leaks.join(', ')}`);
    err.name = 'HtmlSafetyError';
    throw err;
  }
  return true;
}

// ── Render: makine-okur JSON + güvenli manifest ──────────────────────────────
/** TEST-SONUCLARI.json metni (deterministik). */
export function renderResultJson(model) {
  return JSON.stringify(model, null, 2) + '\n';
}

/**
 * SABAH-TESLIM-MANIFEST.json modeli. Manifest KENDİNİ hash'lemez (§ FAZ4): yalnız
 * verilen teslim dosyalarının relative path + byte size + SHA-256'sını taşır.
 * @param {{relativePath:string, content:string|Buffer}[]} entries
 * @param {string} generatedAt
 */
export function buildManifest(entries, generatedAt) {
  const files = entries
    .map((e) => {
      const buf = Buffer.isBuffer(e.content) ? e.content : Buffer.from(String(e.content), 'utf8');
      return {
        relativePath: e.relativePath,
        size: buf.length,
        sha256: createHash('sha256').update(buf).digest('hex'),
      };
    })
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    manifestOf: 'wp-morning-delivery',
    note: 'Manifest kendini hash\'lemez; yalnız listelenen teslim dosyalarını doğrular.',
    files,
  };
}

/** Manifest metni. */
export function renderManifestJson(manifest) {
  return JSON.stringify(manifest, null, 2) + '\n';
}

/**
 * Üretilen bir metin çıktısında ham sızıntı/mutlak yol/stack taraması. Rapora
 * yazmadan ÖNCE çağrılır (fail-closed). Boş dizi = temiz.
 * @param {string} text
 * @returns {string[]}
 */
export function scanOutputLeaks(text) {
  const s = String(text);
  const problems = [];
  for (const cls of findSecrets(s)) problems.push(`secret:${cls}`);
  // Mutlak yerel kullanıcı yolu (ör. /Users/<x>/ veya /home/<x>/ veya C:\Users\).
  if (/(?:^|["'\s(])\/(?:Users|home)\/[^/"'\s]+\//.test(s)) problems.push('absolute-path');
  if (/[A-Za-z]:\\\\?Users\\\\?/.test(s)) problems.push('absolute-path-win');
  // Stack izi göstergesi.
  if (/\n\s+at\s+[\w$.<>]+\s+\(/.test(s)) problems.push('stack-trace');
  return problems;
}
