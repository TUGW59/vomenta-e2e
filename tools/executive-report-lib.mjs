// @ts-check
/**
 * WP-REPORT-TRUTH-2 (FAZ 6) — YÖNETİCİ TEK-GERÇEKLİK RAPORU (saf kütüphane).
 *
 * Üç AYRI gerçeklik kaynağını (runtime / kapsam-derinliği / bulgu) TEK yönetici
 * görünümünde birleştirir — ama semantiklerini ASLA karıştırmadan. Bu dosya yalnız
 * saf fonksiyon içerir (dosya sistemi/CLI yan etkisi yok) → tümü
 * `self-check-executive-report.mjs` tarafından TAMAMEN sentetik fixture'larla,
 * production'a bağlanmadan doğrulanır.
 *
 * DÜRÜSTLÜK ÇEKİRDEĞİ (HANDOFF §6.2–§6.7):
 * - "Tanımlanan test" ≠ "bu koşumda çalışan test"; ayrı sayılar ayrı gösterilir.
 * - "55/55 L1 PASS" ASLA "L2 tamamlandı" gibi sunulmaz: L1-proven ile L2-complete
 *   AYRI sayılardır ve rapor bunu açıkça ayırır.
 * - FAIL/FLAKY/BLOCKED/NOT_RUN gizlenmez; hepsi ayrı gösterilir.
 * - Üç kaynak arasındaki uyumsuzluk (ör. kayıtlı rota 55 vs 65) sessizce
 *   "birinden birini seç" ile örtülmez → consistency paneli DRIFT olarak raporlar.
 * - Her kaynağın kendi provenance'ı taşınır; en kötü verdict manşete çıkar.
 * - Trend YALNIZ ≥2 güvenilir, aynı schemaVersion + commit/run kimlikli snapshot
 *   varsa üretilir; yoksa INSUFFICIENT_HISTORY (sahte yüzde YOK).
 * - Ham hata/stack/PII çıktıya taşınmaz (assertHtmlSafe + scanOutputLeaks yeniden
 *   kullanılır; kendi başlıklarımız redactText'ten geçer).
 */
import { assertHtmlSafe, scanOutputLeaks } from './runtime-report-lib.mjs';
import { redactText } from '../tests/fixtures/sanitize.js';

export const SCHEMA_VERSION = 1;
export const GENERATOR = 'wp-report-truth-2';

export const ROUTE_STATUS_ORDER = Object.freeze(['PASS', 'FAIL', 'FLAKY', 'BLOCKED', 'NOT_RUN']);
export const SEVERITY_ORDER = Object.freeze(['critical', 'high', 'medium', 'low']);
const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

// ── Küçük güvenli yardımcılar ────────────────────────────────────────────────
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
/**
 * Güvenli, sınırlı, redakte edilmiş kısa metin (rota/id gibi düşük-riskli alanlar).
 * redactText'e ek olarak mutlak yerel yolları da nötrler — meşru rotalar (`/settings`)
 * etkilenmez; yalnız `/Users/<x>/`, `/home/<x>/`, `C:\Users\<x>` gibi sızıntı desenleri
 * `[path]` olur (scanOutputLeaks ile aynı savunma, fail-closed'a düşmeden temizler).
 */
const safe = (v, max = 120) =>
  redactText(String(v ?? ''))
    .replace(/\/(?:Users|home)\/[^/\s"']+(?:\/[^\s"']*)?/g, '[path]')
    .replace(/[A-Za-z]:\\Users\\[^\\\s"']+(?:\\[^\s"']*)?/g, '[path]')
    .slice(0, max);
const safeSha = (v) => (v ? String(v).slice(0, 40).replace(/[^a-f0-9]/gi, '') || null : null);

/**
 * Runtime snapshot'ından (TEST-SONUCLARI.json şeması) yönetici özet çıkarır.
 * Kaynak yoksa `present:false` döner; sayılar uydurulmaz.
 * @param {any} runtime
 */
export function summarizeRuntime(runtime) {
  if (!runtime || typeof runtime !== 'object') {
    return { present: false };
  }
  const inv = runtime.inventory || {};
  const rt = runtime.runtime || {};
  const totals = rt.routeStatusTotals || {};
  const prov = runtime.provenance || {};
  const kb = inv.knownBugs || {};
  return {
    present: true,
    schemaVersion: num(runtime.schemaVersion) || null,
    source: {
      commitSha: safeSha(runtime.source && runtime.source.commitSha),
      environment: safe(runtime.source && runtime.source.environment, 40) || null,
      browser: safe(runtime.source && runtime.source.browser, 40) || null,
      project: safe(runtime.source && runtime.source.project, 60) || null,
      runId: runtime.source && runtime.source.runId ? String(runtime.source.runId).replace(/[^0-9]/g, '').slice(0, 32) || null : null,
      runStartedAt: runtime.source && runtime.source.runStartedAt ? safe(runtime.source.runStartedAt, 40) : null,
    },
    generatedAt: safe(runtime.generatedAt, 40) || null,
    provenance: {
      verdict: safe(prov.verdict, 20) || 'UNKNOWN',
      reasons: Array.isArray(prov.reasons) ? prov.reasons.map((r) => safe(r, 60)) : [],
    },
    // §6.3 zorunlu AYRI sayılar (asla tek "kapsam yüzdesi"ne indirgenmez):
    registeredRoutes: num(inv.registeredRoutes),
    testedPagesContracts: num(inv.testedPagesContracts),
    definedLogicalTests: Number.isFinite(inv.definedLogical) ? num(inv.definedLogical) : null,
    // Güvenli/çalıştırılabilir test: bu kaynakta ölçülmemişse null → "ölçülmedi" (uydurulmaz).
    safeRunnableTests: Number.isFinite(inv.runnableInventory) ? num(inv.runnableInventory) : null,
    selectedThisRun: num(rt.selectedThisRun),
    executedThisRun: num(rt.executedThisRun),
    passedThisRun: num(rt.passedThisRun),
    failedThisRun: num(rt.failedThisRun),
    flakyThisRun: num(rt.flakyThisRun),
    skippedThisRun: num(rt.skippedThisRun),
    knownBugExpectedFail: num(rt.knownBugExpectedFail),
    routeStatusTotals: {
      PASS: num(totals.PASS),
      FAIL: num(totals.FAIL),
      FLAKY: num(totals.FLAKY),
      BLOCKED: num(totals.BLOCKED),
      NOT_RUN: num(totals.NOT_RUN),
    },
    knownBugs: {
      total: num(kb.total),
      open: num(kb.open),
      fixedCandidate: num(kb.fixedCandidate),
      closed: num(kb.closed),
    },
    unmappedTests: Array.isArray(runtime.unmappedTests) ? runtime.unmappedTests.length : 0,
    unmappedFindings: Array.isArray(runtime.unmappedFindings) ? runtime.unmappedFindings.length : 0,
    pages: Array.isArray(runtime.pages) ? runtime.pages : [],
  };
}

/**
 * Depth snapshot'ından (SURFACE-DEPTH.json şeması) yönetici özet çıkarır.
 * @param {any} depth
 */
export function summarizeDepth(depth) {
  if (!depth || typeof depth !== 'object') return { present: false };
  const t = depth.totals || {};
  const src = depth.source || {};
  return {
    present: true,
    schemaVersion: num(depth.schemaVersion) || null,
    source: {
      commitSha: safeSha(src.sourceCommit),
      environment: safe(src.environment, 40) || null,
      browser: safe(src.browser, 40) || null,
    },
    generatedAt: safe(depth.generatedAt, 40) || null,
    registeredRoutes: num(t.registeredRoutes),
    l1Proven: num(t.l1Proven),
    l1NotProven: num(t.l1NotProven),
    // L2: stil-sözleşmesi ≠ etkileşim (davranış). AYRI tutulur.
    l2StyleContractMet: num(t.l2StyleContractMet),
    l2StyleGap: num(t.l2StyleGap),
    l2Complete: num(t.l2Complete),
    l2Partial: num(t.l2Partial),
    l2NotCovered: num(t.l2NotCovered),
    interactionUnverifiedRoutes: num(t.interactionUnverifiedRoutes),
    l3Blocked: num(t.l3Blocked),
    l3NotApplicable: num(t.l3NotApplicable),
    l3Proven: num(t.l3Proven),
    l4Blocked: num(t.l4Blocked),
    l4Proven: num(t.l4Proven),
    l5Blocked: num(t.l5Blocked),
    l5Proven: num(t.l5Proven),
    highestLevel: {
      L0: num(t.highestLevel && t.highestLevel.L0),
      L1: num(t.highestLevel && t.highestLevel.L1),
      L2_STYLE: num(t.highestLevel && t.highestLevel.L2_STYLE),
      L2_DEEP: num(t.highestLevel && t.highestLevel.L2_DEEP),
    },
    routesWithFindings: num(t.routesWithFindings),
    openFindingsOnRoutes: num(t.openFindingsOnRoutes),
    pages: Array.isArray(depth.pages) ? depth.pages : [],
  };
}

/**
 * Bulgu registry'sinden (findings.json şeması) severity × status özeti.
 * @param {any} findings
 */
export function summarizeFindings(findings) {
  if (!findings || typeof findings !== 'object') return { present: false };
  const list = Array.isArray(findings.findings) ? findings.findings : [];
  const byStatus = { open: 0, closed: 0, fixedCandidate: 0, other: 0 };
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, other: 0 };
  const openBySeverity = { critical: 0, high: 0, medium: 0, low: 0, other: 0 };
  const byRoute = new Map();
  for (const f of list) {
    const st = String(f.status || '');
    if (st === 'open') byStatus.open++;
    else if (st === 'closed') byStatus.closed++;
    else if (st === 'fixed-candidate') byStatus.fixedCandidate++;
    else byStatus.other++;
    const sev = SEVERITY_ORDER.includes(f.severity) ? f.severity : 'other';
    bySeverity[sev]++;
    if (st === 'open') {
      openBySeverity[sev]++;
      const route = f.route ? safe(f.route, 80) : '(rota yok)';
      if (!byRoute.has(route)) byRoute.set(route, []);
      byRoute.get(route).push({ id: safe(f.id, 40), severity: sev });
    }
  }
  return {
    present: true,
    total: list.length,
    byStatus,
    bySeverity,
    openBySeverity,
    openByRoute: byRoute,
  };
}

/**
 * Üç kaynak arasındaki tutarlılık denetimi. Uyumsuzluk sessizce gizlenmez;
 * DRIFT olarak raporlanır (dürüstlük çekirdeği). Sayı seçimi YAPILMAZ — fark
 * gösterilir.
 * @param {ReturnType<typeof summarizeRuntime>} rt
 * @param {ReturnType<typeof summarizeDepth>} dp
 * @param {ReturnType<typeof summarizeFindings>} fn
 */
export function checkConsistency(rt, dp, fn) {
  const checks = [];
  const warnings = [];
  const addCheck = (name, values, agree, note) => {
    checks.push({ name, values, agree, note: note || '' });
    if (!agree) warnings.push(`${name}: kaynaklar uyuşmuyor (${Object.entries(values).map(([k, v]) => `${k}=${v}`).join(', ')}). ${note || ''}`.trim());
  };

  // Kayıtlı rota sayısı: runtime vs depth.
  if (rt.present && dp.present) {
    const agree = rt.registeredRoutes === dp.registeredRoutes;
    addCheck('Kayıtlı rota sayısı', { runtime: rt.registeredRoutes, depth: dp.registeredRoutes }, agree,
      agree ? '' : 'İki snapshot farklı registry durumundan üretilmiş olabilir; runtime bölümü kendi sayısını, depth bölümü kendi sayısını kullanır.');
  }
  // Bilinen bulgu toplamı: runtime.knownBugs.total vs findings.total.
  if (rt.present && fn.present) {
    const agree = rt.knownBugs.total === fn.total;
    addCheck('Bilinen bulgu toplamı', { runtimeSnapshot: rt.knownBugs.total, findingsRegistry: fn.total }, agree,
      agree ? '' : 'Runtime snapshot bulgu sayısı ile canlı findings registry farklı → runtime snapshot bayat olabilir. Bulgu bölümü registry\'yi kaynak alır.');
  }
  // Açık bulgu: runtime.knownBugs.open vs findings.byStatus.open.
  if (rt.present && fn.present) {
    const agree = rt.knownBugs.open === fn.byStatus.open;
    addCheck('Açık bulgu', { runtimeSnapshot: rt.knownBugs.open, findingsRegistry: fn.byStatus.open }, agree,
      agree ? '' : 'Açık bulgu sayısı kaynaklar arası farklı.');
  }
  // Provenance verdict — runtime doğrulanmamışsa manşet uyarısı.
  if (rt.present && rt.provenance.verdict && rt.provenance.verdict !== 'VERIFIED') {
    warnings.push(`Runtime snapshot provenance = ${rt.provenance.verdict} (${rt.provenance.reasons.join(', ') || 'sebep yok'}). Bu sonuçlar TAZE, doğrulanmış bir Playwright koşumunu KANITLAMAZ.`);
  }
  // Commit uyumu — runtime vs depth kaynağı.
  if (rt.present && dp.present && rt.source.commitSha && dp.source.commitSha && rt.source.commitSha !== dp.source.commitSha) {
    warnings.push(`Runtime (${rt.source.commitSha}) ve depth (${dp.source.commitSha}) farklı commit'ten üretilmiş.`);
  }

  const verdict = warnings.length === 0 ? 'CONSISTENT' : 'DRIFT';
  return { verdict, checks, warnings };
}

/**
 * Depth sayfalarından L3–L5 blok sebeplerini (staging/rol/provider) toplar.
 * @param {ReadonlyArray<any>} depthPages
 */
export function aggregateBlockReasons(depthPages) {
  const agg = { L3: {}, L4: {}, L5: {} };
  for (const p of depthPages || []) {
    for (const lvl of ['L3', 'L4', 'L5']) {
      const node = p.levels && p.levels[lvl];
      if (node && node.status === 'BLOCKED') {
        const code = safe(node.reasonCode || 'UNSPECIFIED', 60);
        agg[lvl][code] = (agg[lvl][code] || 0) + 1;
      }
    }
  }
  return agg;
}

/**
 * En yüksek riskli kapsam boşlukları. Runtime + depth + findings BİRLEŞTİRİLİR
 * ama her boşluk türü kendi semantiğini korur:
 *  A) L1 kanıtlanmamış rota (sayfa açılışı bile kanıtlı değil) — en ağır.
 *  B) Açık critical/high bulgu taşıyan rota.
 *  C) Açık bulgu var ama yalnız L2-stil kanıtlı (davranış/etkileşim doğrulanmadı).
 * @param {ReturnType<typeof summarizeDepth>} dp
 * @param {ReturnType<typeof summarizeFindings>} fn
 */
export function buildRiskGaps(dp, fn) {
  const gaps = [];
  const depthByRoute = new Map();
  if (dp.present) for (const p of dp.pages) depthByRoute.set(p.route, p);

  // A) L1 kanıtlanmamış rotalar.
  if (dp.present) {
    for (const p of dp.pages) {
      const l1 = p.levels && p.levels.L1;
      if (l1 && l1.status !== 'PROVEN') {
        gaps.push({
          kind: 'L1_NOT_PROVEN',
          route: safe(p.route, 80),
          rank: 0,
          detail: 'Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil.',
          highestProvenLevel: safe(p.highestProvenLevel, 20),
        });
      }
    }
  }

  // B) & C) Bulgu-temelli boşluklar (açık bulgular üzerinden).
  if (fn.present) {
    for (const [route, list] of fn.openByRoute.entries()) {
      const hasCritHigh = list.some((x) => x.severity === 'critical' || x.severity === 'high');
      const dpage = depthByRoute.get(route);
      const highest = dpage ? String(dpage.highestProvenLevel || '') : null;
      if (hasCritHigh) {
        gaps.push({
          kind: 'OPEN_CRITICAL_HIGH_FINDING',
          route,
          rank: 1,
          detail: `Açık yüksek-önem bulgu: ${list.filter((x) => x.severity === 'critical' || x.severity === 'high').map((x) => `${x.id}(${x.severity})`).join(', ')}.`,
          highestProvenLevel: highest,
        });
      }
      // C) yalnız stil kanıtlı (L2_STYLE veya altı) ama açık bulgu var → davranış doğrulanmadı.
      if (dpage && (highest === 'L2_STYLE' || highest === 'L1' || highest === 'L0')) {
        gaps.push({
          kind: 'FINDINGS_BEHAVIOR_UNVERIFIED',
          route,
          rank: 2,
          detail: `Açık bulgu var ve en yüksek kanıt seviyesi ${highest || '?'} — davranış/etkileşim (L2-deep+) doğrulanmadı.`,
          highestProvenLevel: highest,
        });
      }
    }
  }

  // Sıralama: rank sonra rota (deterministik).
  gaps.sort((a, b) => a.rank - b.rank || a.route.localeCompare(b.route));
  return gaps;
}

/**
 * Trend/geçmiş doğruluğu (§6.5). SADECE ≥2 güvenilir, aynı schemaVersion +
 * commit/run kimlikli snapshot varsa üretilir. Yoksa INSUFFICIENT_HISTORY.
 *
 * @param {ReadonlyArray<any>} history En eskiden en yeniye sıralı runtime-benzeri
 *   snapshotlar. Her biri: { schemaVersion, source:{commitSha,runId}, generatedAt,
 *   runtime:{routeStatusTotals}, failingTestKeys?:string[] }.
 * @param {number} currentSchemaVersion
 */
export function computeTrend(history, currentSchemaVersion) {
  const warnings = [];
  const list = Array.isArray(history) ? history.slice() : [];
  // Yalnız aynı schemaVersion + commit/run kimlikli snapshot trend girdisi olabilir.
  const eligible = [];
  for (const s of list) {
    const sv = num(s && s.schemaVersion);
    const sha = s && s.source && s.source.commitSha;
    const runId = s && s.source && s.source.runId;
    if (sv !== currentSchemaVersion) {
      warnings.push(`Şema uyumsuz snapshot yok sayıldı (schemaVersion=${sv || '?'} ≠ ${currentSchemaVersion}).`);
      continue;
    }
    if (!sha || !runId) {
      warnings.push('Commit/run kimliği olmayan snapshot trend girdisi olamaz — atlandı.');
      continue;
    }
    eligible.push(s);
  }

  if (eligible.length < 2) {
    return {
      status: 'INSUFFICIENT_HISTORY',
      reason: `Trend için ≥2 uygun snapshot gerekir; ${eligible.length} bulundu. Sahte yüzde/eğilim üretilmez.`,
      eligibleSnapshots: eligible.length,
      warnings,
    };
  }

  // Son iki uygun snapshot: yeni-vs-düzelmiş failure (test kimliği bazlı).
  const prev = eligible[eligible.length - 2];
  const curr = eligible[eligible.length - 1];
  const prevFail = new Set((prev.failingTestKeys || []).map((k) => String(k)));
  const currFail = new Set((curr.failingTestKeys || []).map((k) => String(k)));
  const newFailures = [...currFail].filter((k) => !prevFail.has(k)).sort();
  const fixedFailures = [...prevFail].filter((k) => !currFail.has(k)).sort();
  return {
    status: 'OK',
    reason: '',
    eligibleSnapshots: eligible.length,
    from: { commitSha: safeSha(prev.source.commitSha), runId: String(prev.source.runId), generatedAt: safe(prev.generatedAt, 40) },
    to: { commitSha: safeSha(curr.source.commitSha), runId: String(curr.source.runId), generatedAt: safe(curr.generatedAt, 40) },
    newFailures: newFailures.map((k) => safe(k, 160)),
    fixedFailures: fixedFailures.map((k) => safe(k, 160)),
    note: '"Düzeldi" = önceki failure son koşumda pass; ürün bug closed anlamına GELMEZ. "Yeni failure" test kimliği+proje+route eşlemesiyle hesaplanır.',
    warnings,
  };
}

/**
 * TAM yönetici modelini kurar. Üç kaynak ayrı bölüm; ortak kesişim yalnız risk
 * boşlukları ve consistency panelinde kurulur.
 *
 * @param {object} opts
 * @param {any} opts.runtime TEST-SONUCLARI.json (parse'lı) | null
 * @param {any} opts.depth SURFACE-DEPTH.json (parse'lı) | null
 * @param {any} opts.findings findings.json (parse'lı) | null
 * @param {ReadonlyArray<any>} [opts.history] Trend için önceki snapshotlar
 * @param {string} opts.generatedAt ISO (deterministik test için dışarıdan)
 */
export function buildExecutiveModel(opts) {
  const { runtime = null, depth = null, findings = null, history = [], generatedAt } = opts;
  if (!generatedAt) throw new Error('buildExecutiveModel: generatedAt zorunlu.');

  const rt = summarizeRuntime(runtime);
  const dp = summarizeDepth(depth);
  const fn = summarizeFindings(findings);

  const missing = [];
  if (!rt.present) missing.push('runtime');
  if (!dp.present) missing.push('depth');
  if (!fn.present) missing.push('findings');

  const consistency = checkConsistency(rt, dp, fn);
  const riskGaps = buildRiskGaps(dp, fn);
  const trend = computeTrend(history, SCHEMA_VERSION);
  const blockReasons = aggregateBlockReasons(dp.present ? dp.pages : []);

  // En fazla açık bulguya sahip sayfalar (findings registry'den, deterministik).
  const topFindingPages = fn.present
    ? [...fn.openByRoute.entries()]
        .map(([route, list]) => ({
          route,
          openCount: list.length,
          severities: SEVERITY_ORDER.reduce((acc, s) => {
            const c = list.filter((x) => x.severity === s).length;
            if (c) acc[s] = c;
            return acc;
          }, /** @type {Record<string,number>} */ ({})),
          worst: list.map((x) => x.severity).sort((a, b) => SEV_RANK[a] - SEV_RANK[b])[0] || 'low',
        }))
        .sort((a, b) => b.openCount - a.openCount || SEV_RANK[a.worst] - SEV_RANK[b.worst] || a.route.localeCompare(b.route))
    : [];

  // Runtime sayfa-türevli listeler (yalnız runtime kaynağı varsa).
  const flakyTests = rt.present
    ? rt.pages.filter((p) => num(p.flaky) > 0).map((p) => ({ route: safe(p.route, 80), flaky: num(p.flaky) }))
    : [];
  const slowestTests = rt.present
    ? rt.pages
        .filter((p) => Number.isFinite(p.durationMs) && num(p.durationMs) > 0)
        .map((p) => ({ route: safe(p.route, 80), durationMs: num(p.durationMs) }))
        .sort((a, b) => b.durationMs - a.durationMs)
        .slice(0, 10)
    : [];
  const blockedRuntimeRoutes = rt.present
    ? rt.pages
        .filter((p) => p.baselineStatus === 'BLOCKED' || p.baselineStatus === 'NOT_RUN' || p.baselineStatus === 'FAIL' || p.baselineStatus === 'FLAKY')
        .map((p) => ({ route: safe(p.route, 80), status: p.baselineStatus, reason: safe(p.statusReason, 60) }))
    : [];

  const model = {
    schemaVersion: SCHEMA_VERSION,
    generator: GENERATOR,
    generatedAt,
    sourcesPresent: { runtime: rt.present, depth: dp.present, findings: fn.present },
    missingSources: missing,
    // En kötü provenance verdict'i manşete taşınır.
    headlineProvenance: rt.present ? rt.provenance.verdict : 'NO_RUNTIME_SOURCE',
    consistency,
    // ── Üç AYRI semantik bölüm (karışmaz) ──
    runtimeSummary: rt.present ? {
      source: rt.source,
      generatedAt: rt.generatedAt,
      provenance: rt.provenance,
      registeredRoutes: rt.registeredRoutes,
      testedPagesContracts: rt.testedPagesContracts,
      definedLogicalTests: rt.definedLogicalTests,
      safeRunnableTests: rt.safeRunnableTests,
      selectedThisRun: rt.selectedThisRun,
      executedThisRun: rt.executedThisRun,
      passedThisRun: rt.passedThisRun,
      failedThisRun: rt.failedThisRun,
      flakyThisRun: rt.flakyThisRun,
      skippedThisRun: rt.skippedThisRun,
      knownBugExpectedFail: rt.knownBugExpectedFail,
      routeStatusTotals: rt.routeStatusTotals,
      unmappedTests: rt.unmappedTests,
    } : null,
    depthSummary: dp.present ? {
      source: dp.source,
      generatedAt: dp.generatedAt,
      registeredRoutes: dp.registeredRoutes,
      l1Proven: dp.l1Proven,
      l1NotProven: dp.l1NotProven,
      l2StyleContractMet: dp.l2StyleContractMet,
      l2Complete: dp.l2Complete,
      l2Partial: dp.l2Partial,
      l2NotCovered: dp.l2NotCovered,
      interactionUnverifiedRoutes: dp.interactionUnverifiedRoutes,
      l3Blocked: dp.l3Blocked,
      l3NotApplicable: dp.l3NotApplicable,
      l3Proven: dp.l3Proven,
      l4Blocked: dp.l4Blocked,
      l4Proven: dp.l4Proven,
      l5Blocked: dp.l5Blocked,
      l5Proven: dp.l5Proven,
      highestLevel: dp.highestLevel,
      routesWithFindings: dp.routesWithFindings,
      openFindingsOnRoutes: dp.openFindingsOnRoutes,
      blockReasons,
    } : null,
    findingsSummary: fn.present ? {
      total: fn.total,
      byStatus: fn.byStatus,
      bySeverity: fn.bySeverity,
      openBySeverity: fn.openBySeverity,
    } : null,
    // ── Kesişim görünümleri (semantik korunur) ──
    riskGaps,
    topFindingPages,
    flakyTests,
    slowestTests,
    blockedRuntimeRoutes,
    trend,
    warnings: [...consistency.warnings],
  };

  validateExecutiveInvariants(model);
  return model;
}

/** Model invariant kapısı — dürüstlük ihlali → Error (fail-closed). */
export function validateExecutiveInvariants(model) {
  const errors = [];
  if (model.schemaVersion !== SCHEMA_VERSION) errors.push('schemaVersion beklenenden farklı.');

  // Runtime rota durum toplamı = kayıtlı rota (runtime kendi içinde tutarlı olmalı).
  if (model.runtimeSummary) {
    const t = model.runtimeSummary.routeStatusTotals;
    const sum = t.PASS + t.FAIL + t.FLAKY + t.BLOCKED + t.NOT_RUN;
    if (sum !== model.runtimeSummary.registeredRoutes) {
      errors.push(`Runtime rota durum toplamı (${sum}) ≠ runtime kayıtlı rota (${model.runtimeSummary.registeredRoutes}).`);
    }
    // "L1 PASS = L2 complete" yanılgısı engeli: eğer depth de varsa, l2Complete
    // asla registeredRoutes'a EŞİT gösterilmemeli (sahte "tamamlandı" koruması).
  }
  // Depth L1 proven + not-proven = kayıtlı rota.
  if (model.depthSummary) {
    const d = model.depthSummary;
    if (d.l1Proven + d.l1NotProven !== d.registeredRoutes) {
      errors.push(`Depth L1 proven+notProven (${d.l1Proven + d.l1NotProven}) ≠ depth kayıtlı rota (${d.registeredRoutes}).`);
    }
    if (d.l2Complete + d.l2Partial + d.l2NotCovered !== d.registeredRoutes) {
      errors.push(`Depth L2 complete+partial+notCovered (${d.l2Complete + d.l2Partial + d.l2NotCovered}) ≠ depth kayıtlı rota (${d.registeredRoutes}).`);
    }
  }
  // En az bir kaynak olmalı.
  if (!model.runtimeSummary && !model.depthSummary && !model.findingsSummary) {
    errors.push('Hiç kaynak yok: runtime/depth/findings üçü de eksik.');
  }
  // Trend statüsü kanonik.
  if (!['OK', 'INSUFFICIENT_HISTORY'].includes(model.trend.status)) {
    errors.push(`Geçersiz trend statüsü: ${model.trend.status}`);
  }
  if (errors.length) {
    const err = new Error('Yönetici model invariant ihlali:\n  - ' + errors.join('\n  - '));
    err.name = 'ExecutiveModelInvariantError';
    throw err;
  }
  return true;
}

// ── Render: Markdown ─────────────────────────────────────────────────────────
function mdCell(v) {
  return String(v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}
const PROV_BADGE = { VERIFIED: '✅ VERIFIED', STALE: '🟠 STALE', UNVERIFIED: '⛔ UNVERIFIED', NO_RUNTIME_SOURCE: '⚪ KAYNAK YOK', UNKNOWN: '❔ UNKNOWN' };

export function renderExecutiveMarkdown(model) {
  const L = [];
  const rt = model.runtimeSummary;
  const dp = model.depthSummary;
  const fn = model.findingsSummary;

  L.push('# Vomenta — Yönetici Kalite Özeti (Tek Gerçeklik)');
  L.push('');
  L.push('> ⚙️ **Otomatik üretilir** (`npm run report:executive`). Üç AYRI gerçekliği — **koşum sonucu**, **kapsam derinliği**, **açık bulgular** — tek görünümde ama **semantiklerini karıştırmadan** birleştirir.');
  L.push(`> **Üretim:** \`${mdCell(model.generatedAt)}\` · **Manşet provenance:** ${PROV_BADGE[model.headlineProvenance] || model.headlineProvenance}`);
  L.push('');

  // Manşet uyarısı: provenance doğrulanmamışsa.
  if (model.headlineProvenance !== 'VERIFIED') {
    L.push(`> ⚠️ **DİKKAT:** Runtime sonuçları **${mdCell(model.headlineProvenance)}** — TAZE, doğrulanmış bir Playwright koşumunu kanıtlamaz. Sayılar son *kaydedilmiş* snapshot'tandır; güncel koşum için \`npm run report:runtime\`.`);
    L.push('');
  }

  // ── Kaynak künyesi ──
  L.push('## Kaynak künyesi');
  L.push('');
  L.push('| Kaynak | Var mı | Commit | Ortam | Tarayıcı | Run ID | Üretim | Provenance |');
  L.push('|---|---|---|---|---|---|---|---|');
  L.push(`| Runtime | ${rt ? '✅' : '⛔'} | ${mdCell(rt ? rt.source.commitSha : '—')} | ${mdCell(rt ? rt.source.environment : '—')} | ${mdCell(rt ? rt.source.browser : '—')} | ${mdCell(rt && rt.source.runId ? rt.source.runId : '—')} | ${mdCell(rt ? rt.generatedAt : '—')} | ${rt ? (PROV_BADGE[rt.provenance.verdict] || rt.provenance.verdict) : '—'} |`);
  L.push(`| Depth | ${dp ? '✅' : '⛔'} | ${mdCell(dp ? dp.source.commitSha : '—')} | ${mdCell(dp ? dp.source.environment : '—')} | ${mdCell(dp ? dp.source.browser : '—')} | — | ${mdCell(dp ? dp.generatedAt : '—')} | — |`);
  L.push(`| Findings | ${fn ? '✅' : '⛔'} | — | — | — | — | — | — |`);
  L.push('');

  // ── Tutarlılık paneli ──
  L.push(`## Kaynaklar arası tutarlılık: ${model.consistency.verdict === 'CONSISTENT' ? '✅ CONSISTENT' : '⚠️ DRIFT'}`);
  L.push('');
  if (model.consistency.checks.length) {
    L.push('| Kontrol | Değerler | Uyumlu | Not |');
    L.push('|---|---|---|---|');
    for (const c of model.consistency.checks) {
      L.push(`| ${mdCell(c.name)} | ${mdCell(Object.entries(c.values).map(([k, v]) => `${k}=${v}`).join(', '))} | ${c.agree ? '✅' : '❌'} | ${mdCell(c.note)} |`);
    }
    L.push('');
  }
  if (model.consistency.warnings.length) {
    for (const w of model.consistency.warnings) L.push(`- ⚠️ ${mdCell(w)}`);
    L.push('');
  }

  // ── 1) Koşum (runtime) ──
  L.push('## 1) Son koşumda ne çalıştı ve ne geçti? (runtime)');
  L.push('');
  if (rt) {
    L.push(`- **Kayıtlı rota (runtime snapshot):** ${rt.registeredRoutes}`);
    L.push(`- **Tanımlanan test:** ${rt.definedLogicalTests ?? '—'} · **Güvenli/çalıştırılabilir test:** ${rt.safeRunnableTests ?? '_ölçülmedi_'} · **Bu koşumda seçilen:** ${rt.selectedThisRun} · **Bu koşumda çalışan:** ${rt.executedThisRun}`);
    L.push(`- **Rota durumu:** ✅ PASS ${rt.routeStatusTotals.PASS} · ❌ FAIL ${rt.routeStatusTotals.FAIL} · 🟡 FLAKY ${rt.routeStatusTotals.FLAKY} · ⛔ BLOCKED ${rt.routeStatusTotals.BLOCKED} · ⚪ NOT_RUN ${rt.routeStatusTotals.NOT_RUN}`);
    L.push(`- **Koşum lensi:** geçen ${rt.passedThisRun} · başarısız ${rt.failedThisRun} · flaky ${rt.flakyThisRun} · atlanan ${rt.skippedThisRun}${rt.knownBugExpectedFail ? ` · known-bug-expected-fail ${rt.knownBugExpectedFail}` : ''}`);
    L.push(`- **Rotaya eşlenmeyen test:** ${rt.unmappedTests} (sayfa durumuna sayılmaz — sahte PASS engeli).`);
    L.push('');
    L.push('> ℹ️ "Tanımlanan test" ile "bu koşumda çalışan test" **aynı sayı değildir**. Bir rotanın PASS olması yalnız read-only açılışını kanıtlar.');
  } else {
    L.push('- ⛔ Runtime kaynağı yok — koşum sonucu raporlanamıyor.');
  }
  L.push('');

  // ── 2) Derinlik (depth) ──
  L.push('## 2) Her sayfanın otomasyon derinliği nedir? (kapsam)');
  L.push('');
  if (dp) {
    L.push(`- **Kayıtlı rota (depth):** ${dp.registeredRoutes}`);
    L.push(`- **L1 (açılış) proven:** ${dp.l1Proven} · **L1 kanıtlanmamış:** ${dp.l1NotProven}`);
    L.push(`- **L2 complete:** ${dp.l2Complete} · **L2 partial:** ${dp.l2Partial} · **L2 not-covered:** ${dp.l2NotCovered} · _(stil sözleşmesi karşılanan: ${dp.l2StyleContractMet}; etkileşim doğrulanmamış rota: ${dp.interactionUnverifiedRoutes})_`);
    L.push(`- **L3:** proven ${dp.l3Proven} · blocked ${dp.l3Blocked} · N/A ${dp.l3NotApplicable}`);
    L.push(`- **L4:** proven ${dp.l4Proven} · blocked ${dp.l4Blocked}  ·  **L5:** proven ${dp.l5Proven} · blocked ${dp.l5Blocked}`);
    L.push(`- **En yüksek kanıt seviyesi dağılımı:** L0 ${dp.highestLevel.L0} · L1 ${dp.highestLevel.L1} · L2-stil ${dp.highestLevel.L2_STYLE} · L2-deep ${dp.highestLevel.L2_DEEP}`);
    L.push('');
    L.push(`> ⛔ **YANLIŞ ÖZET YASAK:** "${dp.l1Proven}/${dp.registeredRoutes} L1 PASS" **≠** "L2 tamamlandı". L2 gerçekten tamamlanan rota: **${dp.l2Complete}**. L3–L5 çoğunlukla staging/rol/provider bekliyor.`);
  } else {
    L.push('- ⛔ Depth kaynağı yok — kapsam derinliği raporlanamıyor.');
  }
  L.push('');

  // ── 3) Bulgular (findings) ──
  L.push('## 3) Hangi açık buglar hangi sayfaları etkiliyor? (bulgular)');
  L.push('');
  if (fn) {
    L.push(`- **Toplam bulgu:** ${fn.total} · **açık:** ${fn.byStatus.open} · **kapalı:** ${fn.byStatus.closed} · **fixed-candidate:** ${fn.byStatus.fixedCandidate}`);
    L.push(`- **Açık (severity):** 🔴 critical ${fn.openBySeverity.critical} · 🟠 high ${fn.openBySeverity.high} · 🟡 medium ${fn.openBySeverity.medium} · ⚪ low ${fn.openBySeverity.low}`);
    L.push('');
    if (model.topFindingPages.length) {
      L.push('### En fazla açık bulguya sahip sayfalar');
      L.push('');
      L.push('| rota | açık bulgu | en ağır | dağılım |');
      L.push('|---|---|---|---|');
      for (const p of model.topFindingPages.slice(0, 12)) {
        L.push(`| ${mdCell(p.route)} | ${p.openCount} | ${mdCell(p.worst)} | ${mdCell(Object.entries(p.severities).map(([s, c]) => `${s}:${c}`).join(', '))} |`);
      }
      L.push('');
    }
  } else {
    L.push('- ⛔ Findings kaynağı yok — bulgular raporlanamıyor.');
  }
  L.push('');

  // ── En yüksek riskli kapsam boşlukları ──
  L.push('## En yüksek riskli kapsam boşlukları');
  L.push('');
  if (model.riskGaps.length) {
    L.push('| öncelik | tür | rota | en yüksek kanıt | açıklama |');
    L.push('|---|---|---|---|---|');
    for (const g of model.riskGaps.slice(0, 20)) {
      L.push(`| ${g.rank} | ${mdCell(g.kind)} | ${mdCell(g.route)} | ${mdCell(g.highestProvenLevel || '—')} | ${mdCell(g.detail)} |`);
    }
    if (model.riskGaps.length > 20) L.push('');
    if (model.riskGaps.length > 20) L.push(`_(+${model.riskGaps.length - 20} boşluk daha — tam liste JSON'da.)_`);
    L.push('');
  } else {
    L.push('- Belirgin risk boşluğu bulunmadı (kaynaklar eksikse bu boşlukların hesaplanamadığı anlamına gelebilir).');
    L.push('');
  }

  // ── Flaky / en yavaş / bloklu ──
  L.push('## Flaky testler');
  L.push('');
  L.push(model.flakyTests.length ? model.flakyTests.map((f) => `- ${mdCell(f.route)} (flaky ${f.flaky})`).join('\n') : '- Bu koşumda flaky rota yok.');
  L.push('');
  L.push('## En yavaş rotalar (koşum süresi)');
  L.push('');
  if (model.slowestTests.length) {
    L.push('| rota | süre (ms) |');
    L.push('|---|---|');
    for (const s of model.slowestTests) L.push(`| ${mdCell(s.route)} | ${s.durationMs} |`);
  } else {
    L.push('- Süre verisi yok.');
  }
  L.push('');
  L.push('## Staging / rol / provider nedeniyle bloklu (ve dikkat gerektiren) testler');
  L.push('');
  if (model.blockedRuntimeRoutes.length) {
    L.push('| rota | durum | neden |');
    L.push('|---|---|---|');
    for (const b of model.blockedRuntimeRoutes) L.push(`| ${mdCell(b.route)} | ${mdCell(b.status)} | ${mdCell(b.reason)} |`);
  } else {
    L.push('- Runtime tarafında FAIL/FLAKY/BLOCKED/NOT_RUN rota yok.');
  }
  if (dp && dp.blockReasons) {
    L.push('');
    L.push('**Derinlik blok sebepleri (L3–L5):**');
    for (const lvl of ['L3', 'L4', 'L5']) {
      const entries = Object.entries(dp.blockReasons[lvl] || {});
      if (entries.length) L.push(`- ${lvl}: ${entries.map(([code, c]) => `${mdCell(code)}×${c}`).join(' · ')}`);
    }
  }
  L.push('');

  // ── Trend ──
  L.push('## Trend / geçmiş karşılaştırma');
  L.push('');
  if (model.trend.status === 'INSUFFICIENT_HISTORY') {
    L.push(`- ⚠️ **INSUFFICIENT_HISTORY** — ${mdCell(model.trend.reason)}`);
    L.push('- Sahte yüzde/eğilim üretilmez. Trend için ≥2 güvenilir, aynı schemaVersion + commit/run kimlikli snapshot gerekir.');
  } else {
    L.push(`- Karşılaştırma: \`${mdCell(model.trend.from.commitSha)}\` (run ${mdCell(model.trend.from.runId)}) → \`${mdCell(model.trend.to.commitSha)}\` (run ${mdCell(model.trend.to.runId)})`);
    L.push(`- **Yeni failure:** ${model.trend.newFailures.length}${model.trend.newFailures.length ? ' — ' + model.trend.newFailures.map(mdCell).join(', ') : ''}`);
    L.push(`- **Düzelmiş failure:** ${model.trend.fixedFailures.length}${model.trend.fixedFailures.length ? ' — ' + model.trend.fixedFailures.map(mdCell).join(', ') : ''}`);
    L.push(`- _${mdCell(model.trend.note)}_`);
  }
  if (model.trend.warnings && model.trend.warnings.length) {
    for (const w of model.trend.warnings) L.push(`  - ${mdCell(w)}`);
  }
  L.push('');

  // ── Kanıtlar / kanıtlamaz ──
  L.push('## Bu rapor neyi kanıtlar / ne kanıtlamaz');
  L.push('');
  L.push('**Kanıtlar:**');
  L.push('- Kayıtlı rotaların son *kaydedilmiş* read-only koşum sonucu (PASS/FAIL/FLAKY/BLOCKED/NOT_RUN gizlenmeden).');
  L.push('- Her sayfanın kanıtlanmış otomasyon derinliği (L1–L5) ve etkileşim doğrulanmamış rotalar.');
  L.push('- Açık bulguların severity dağılımı ve hangi sayfaları etkilediği.');
  L.push('- Kaynaklar arası tutarsızlıklar (DRIFT) açıkça.');
  L.push('');
  L.push('**Kanıtlamaz:**');
  L.push('- Üründeki tüm fonksiyonların uçtan uca test edildiğini.');
  L.push('- Derin fonksiyon/mutation/RBAC/dış-servis kapsamını (staging + rol + provider bekler → L3–L5 çoğu blocked).');
  L.push('- Cross-browser / visual kararlılığı (FAZ 7 alanı).');
  L.push('- Manşet provenance VERIFIED değilse, bu koşumun **taze** olduğunu.');
  L.push('- Bir sayfanın L1 PASS olması, L2+ derinliğinin tamamlandığını.');
  L.push('');

  if (model.missingSources.length) {
    L.push(`> ⚠️ Eksik kaynak: ${model.missingSources.join(', ')} — ilgili bölüm(ler) üretilemedi.`);
    L.push('');
  }
  return L.join('\n');
}

// ── Render: HTML (kendi kendine yeten; script/data/blob/iframe/dış istek YOK) ──
function h(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function renderExecutiveHtml(model) {
  const rt = model.runtimeSummary;
  const dp = model.depthSummary;
  const fn = model.findingsSummary;
  const card = (label, value, cls = '') => `<div class="card ${cls}"><div class="n">${h(String(value))}</div><div class="l">${h(label)}</div></div>`;

  const provClass = { VERIFIED: 'pass', STALE: 'flaky', UNVERIFIED: 'fail', NO_RUNTIME_SOURCE: 'notrun', UNKNOWN: 'notrun' }[model.headlineProvenance] || 'notrun';
  const headlineWarn = model.headlineProvenance !== 'VERIFIED'
    ? `<div class="warn"><strong>DİKKAT:</strong> Runtime sonuçları <b>${h(model.headlineProvenance)}</b> — taze, doğrulanmış bir koşumu kanıtlamaz. Sayılar son kaydedilmiş snapshot'tandır.</div>`
    : '';

  const consistencyRows = model.consistency.checks.map((c) =>
    `<tr class="${c.agree ? '' : 'fail'}"><td>${h(c.name)}</td><td>${h(Object.entries(c.values).map(([k, v]) => `${k}=${v}`).join(', '))}</td><td>${c.agree ? '✅' : '❌'}</td><td>${h(c.note)}</td></tr>`
  ).join('\n');
  const consistencyWarnHtml = model.consistency.warnings.length
    ? `<ul class="warnlist">${model.consistency.warnings.map((w) => `<li>${h(w)}</li>`).join('')}</ul>` : '';

  const riskRows = model.riskGaps.slice(0, 25).map((g) =>
    `<tr class="rank${g.rank}"><td class="num">${g.rank}</td><td>${h(g.kind)}</td><td>${h(g.route)}</td><td>${h(g.highestProvenLevel || '—')}</td><td>${h(g.detail)}</td></tr>`
  ).join('\n');

  const findingPageRows = model.topFindingPages.slice(0, 12).map((p) =>
    `<tr><td>${h(p.route)}</td><td class="num">${p.openCount}</td><td>${h(p.worst)}</td><td>${h(Object.entries(p.severities).map(([s, c]) => `${s}:${c}`).join(', '))}</td></tr>`
  ).join('\n');

  const slowRows = model.slowestTests.map((s) => `<tr><td>${h(s.route)}</td><td class="num">${s.durationMs}</td></tr>`).join('\n');
  const blockedRows = model.blockedRuntimeRoutes.map((b) => `<tr class="${(b.status || '').toLowerCase()}"><td>${h(b.route)}</td><td>${h(b.status)}</td><td>${h(b.reason)}</td></tr>`).join('\n');

  const trendHtml = model.trend.status === 'INSUFFICIENT_HISTORY'
    ? `<p class="warn"><strong>INSUFFICIENT_HISTORY</strong> — ${h(model.trend.reason)} Sahte yüzde/eğilim üretilmez.</p>`
    : `<p>Karşılaştırma: <code>${h(model.trend.from.commitSha)}</code> → <code>${h(model.trend.to.commitSha)}</code>. Yeni failure: <b>${model.trend.newFailures.length}</b> · Düzelmiş: <b>${model.trend.fixedFailures.length}</b>.</p>`;

  const depthBlock = dp ? `
<h2>2) Kapsam derinliği (depth)</h2>
<div class="cards">
${card('Kayıtlı rota', dp.registeredRoutes)}
${card('L1 proven', dp.l1Proven, 'pass')}
${card('L1 kanıtsız', dp.l1NotProven, dp.l1NotProven ? 'fail' : '')}
${card('L2 complete', dp.l2Complete, 'pass')}
${card('L2 partial', dp.l2Partial, 'flaky')}
${card('Etkileşim doğrulanmamış', dp.interactionUnverifiedRoutes, 'flaky')}
</div>
<div class="callout fail"><strong>Yanlış özet yasak:</strong> ${h(String(dp.l1Proven))}/${h(String(dp.registeredRoutes))} L1 PASS <b>≠</b> "L2 tamamlandı". Gerçekten L2 tamamlanan rota: <b>${h(String(dp.l2Complete))}</b>. L3–L5 çoğunlukla staging/rol/provider bekliyor (L3 blocked ${h(String(dp.l3Blocked))}, L4 blocked ${h(String(dp.l4Blocked))}, L5 blocked ${h(String(dp.l5Blocked))}).</div>
` : '<h2>2) Kapsam derinliği (depth)</h2><p class="warn">Depth kaynağı yok.</p>';

  const runtimeBlock = rt ? `
<h2>1) Son koşumda ne çalıştı ve ne geçti? (runtime)</h2>
<div class="cards">
${card('Kayıtlı rota', rt.registeredRoutes)}
${card('PASS', rt.routeStatusTotals.PASS, 'pass')}
${card('FAIL', rt.routeStatusTotals.FAIL, 'fail')}
${card('FLAKY', rt.routeStatusTotals.FLAKY, 'flaky')}
${card('BLOCKED', rt.routeStatusTotals.BLOCKED, 'blocked')}
${card('NOT_RUN', rt.routeStatusTotals.NOT_RUN, 'notrun')}
</div>
<p class="sub">Tanımlanan test: <b>${h(String(rt.definedLogicalTests ?? '—'))}</b> · Güvenli/çalıştırılabilir: <b>${h(String(rt.safeRunnableTests ?? 'ölçülmedi'))}</b> · Bu koşumda seçilen: <b>${h(String(rt.selectedThisRun))}</b> · çalışan: <b>${h(String(rt.executedThisRun))}</b> · geçen ${h(String(rt.passedThisRun))} · başarısız ${h(String(rt.failedThisRun))} · flaky ${h(String(rt.flakyThisRun))} · atlanan ${h(String(rt.skippedThisRun))}. Rotaya eşlenmeyen test: ${h(String(rt.unmappedTests))} (sayfa durumuna sayılmaz).</p>
<p class="note">"Tanımlanan test" ile "bu koşumda çalışan test" aynı sayı değildir. Rota PASS = yalnız read-only açılış kanıtı.</p>
` : '<h2>1) Son koşum (runtime)</h2><p class="warn">Runtime kaynağı yok.</p>';

  const findingsBlock = fn ? `
<h2>3) Açık buglar hangi sayfaları etkiliyor? (bulgular)</h2>
<div class="cards">
${card('Toplam bulgu', fn.total)}
${card('Açık', fn.byStatus.open, 'fail')}
${card('critical', fn.openBySeverity.critical, 'fail')}
${card('high', fn.openBySeverity.high, 'fail')}
${card('medium', fn.openBySeverity.medium, 'flaky')}
${card('low', fn.openBySeverity.low, 'notrun')}
${card('Kapalı', fn.byStatus.closed, 'pass')}
</div>
${findingPageRows ? `<h3>En fazla açık bulguya sahip sayfalar</h3><table><thead><tr><th>Rota</th><th>Açık</th><th>En ağır</th><th>Dağılım</th></tr></thead><tbody>${findingPageRows}</tbody></table>` : ''}
` : '<h2>3) Bulgular</h2><p class="warn">Findings kaynağı yok.</p>';

  const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vomenta — Yönetici Kalite Özeti</title>
<style>
  :root{--ink:#1a2432;--muted:#55606e;--line:#d9dee4;--bg:#fff;--panel:#f6f8fa;--pass:#1a7f4b;--fail:#c02626;--flaky:#b8860b;--blocked:#5b4b8a;--notrun:#6b7280;--warnbg:#fff6e5;--warnln:#d9a300}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
  main{max-width:70rem;margin:0 auto;padding:2rem 1.5rem 3rem}
  h1{font-size:1.7rem;margin:.2rem 0 .3rem}
  h2{font-size:1.2rem;margin:1.7rem 0 .5rem;border-bottom:1px solid var(--line);padding-bottom:.25rem}
  h3{font-size:1rem;margin:1rem 0 .3rem}
  .sub{color:var(--muted);margin:.3rem 0;font-size:.85rem}
  .note{color:var(--muted);font-size:.8rem;font-style:italic;margin:.2rem 0 .6rem}
  .prov{display:inline-block;padding:.1rem .5rem;border-radius:5px;font-weight:700;color:#fff;font-size:.8rem}
  .prov.pass{background:var(--pass)}.prov.fail{background:var(--fail)}.prov.flaky{background:var(--flaky)}.prov.notrun{background:var(--notrun)}
  .warn{background:var(--warnbg);border:1px solid var(--warnln);border-left-width:5px;border-radius:6px;padding:.6rem .9rem;margin:.7rem 0;font-size:.87rem}
  .warnlist{background:var(--warnbg);border:1px solid var(--warnln);border-radius:6px;padding:.5rem .9rem .5rem 1.7rem;font-size:.83rem;color:#5a4600}
  .callout{border:1px solid var(--line);border-left-width:5px;border-radius:6px;padding:.6rem .9rem;margin:.6rem 0;font-size:.87rem;background:var(--panel)}
  .callout.fail{border-left-color:var(--fail);background:#fdf1f1}
  .cards{display:flex;flex-wrap:wrap;gap:.55rem;margin:.6rem 0 .8rem}
  .card{border:1px solid var(--line);border-radius:8px;padding:.55rem .85rem;min-width:6rem;background:var(--panel)}
  .card .n{font-size:1.45rem;font-weight:700}
  .card .l{font-size:.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:.03em}
  .card.pass .n{color:var(--pass)}.card.fail .n{color:var(--fail)}.card.flaky .n{color:var(--flaky)}.card.blocked .n{color:var(--blocked)}.card.notrun .n{color:var(--notrun)}
  table{border-collapse:collapse;width:100%;margin:.5rem 0;font-size:.8rem}
  th,td{border:1px solid var(--line);padding:.3rem .45rem;text-align:left;vertical-align:top}
  th{background:var(--panel);font-weight:600}
  td.num{text-align:right;font-variant-numeric:tabular-nums}
  tr.fail td:first-child{font-weight:600}
  tr.rank0 td:first-child{color:var(--fail);font-weight:700}
  .grid2{display:flex;flex-wrap:wrap;gap:1rem}
  .grid2>div{flex:1;min-width:18rem}
  .proves{display:flex;flex-wrap:wrap;gap:1rem;margin:.4rem 0}
  .proves>div{flex:1;min-width:18rem;border:1px solid var(--line);border-radius:8px;padding:.7rem .9rem}
  code{background:var(--panel);padding:.05rem .3rem;border-radius:3px;font-size:.85em}
  @page{margin:13mm}
</style></head><body><main>
<h1>Vomenta — Yönetici Kalite Özeti</h1>
<p class="sub">Tek gerçeklik: koşum + kapsam + bulgular, semantikleri karışmadan · üretim ${h(model.generatedAt)} · manşet provenance <span class="prov ${provClass}">${h(model.headlineProvenance)}</span></p>
${headlineWarn}

<h2>Kaynak künyesi</h2>
<table><thead><tr><th>Kaynak</th><th>Var</th><th>Commit</th><th>Ortam</th><th>Tarayıcı</th><th>Run ID</th><th>Üretim</th><th>Provenance</th></tr></thead><tbody>
<tr><td>Runtime</td><td>${rt ? '✅' : '⛔'}</td><td>${h(rt ? rt.source.commitSha : '—')}</td><td>${h(rt ? rt.source.environment : '—')}</td><td>${h(rt ? rt.source.browser : '—')}</td><td>${h(rt && rt.source.runId ? rt.source.runId : '—')}</td><td>${h(rt ? rt.generatedAt : '—')}</td><td>${h(rt ? rt.provenance.verdict : '—')}</td></tr>
<tr><td>Depth</td><td>${dp ? '✅' : '⛔'}</td><td>${h(dp ? dp.source.commitSha : '—')}</td><td>${h(dp ? dp.source.environment : '—')}</td><td>${h(dp ? dp.source.browser : '—')}</td><td>—</td><td>${h(dp ? dp.generatedAt : '—')}</td><td>—</td></tr>
<tr><td>Findings</td><td>${fn ? '✅' : '⛔'}</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
</tbody></table>

<h2>Kaynaklar arası tutarlılık: <span class="prov ${model.consistency.verdict === 'CONSISTENT' ? 'pass' : 'fail'}">${h(model.consistency.verdict)}</span></h2>
<table><thead><tr><th>Kontrol</th><th>Değerler</th><th>Uyumlu</th><th>Not</th></tr></thead><tbody>
${consistencyRows}
</tbody></table>
${consistencyWarnHtml}

${runtimeBlock}
${depthBlock}
${findingsBlock}

<h2>En yüksek riskli kapsam boşlukları</h2>
${riskRows ? `<table><thead><tr><th>Öncelik</th><th>Tür</th><th>Rota</th><th>En yüksek kanıt</th><th>Açıklama</th></tr></thead><tbody>${riskRows}</tbody></table>` : '<p class="sub">Belirgin risk boşluğu yok (veya kaynak eksik).</p>'}

<div class="grid2">
<div>
<h2>En yavaş rotalar</h2>
${slowRows ? `<table><thead><tr><th>Rota</th><th>ms</th></tr></thead><tbody>${slowRows}</tbody></table>` : '<p class="sub">Süre verisi yok.</p>'}
</div>
<div>
<h2>Dikkat gerektiren / bloklu rotalar</h2>
${blockedRows ? `<table><thead><tr><th>Rota</th><th>Durum</th><th>Neden</th></tr></thead><tbody>${blockedRows}</tbody></table>` : '<p class="sub">Runtime tarafında FAIL/FLAKY/BLOCKED/NOT_RUN yok.</p>'}
</div>
</div>

<h2>Trend / geçmiş karşılaştırma</h2>
${trendHtml}

<h2>Bu rapor neyi kanıtlar / ne kanıtlamaz</h2>
<div class="proves">
  <div><strong>Kanıtlar:</strong> kayıtlı rotaların son kaydedilmiş read-only koşum sonucu (FAIL/FLAKY/BLOCKED/NOT_RUN gizlenmeden); her sayfanın kanıtlı otomasyon derinliği; açık bulguların severity dağılımı ve etkilediği sayfalar; kaynaklar arası tutarsızlıklar.</div>
  <div><strong>Kanıtlamaz:</strong> tüm fonksiyonların uçtan uca test edildiğini; derin fonksiyon/mutation/RBAC/dış-servis kapsamını (L3–L5 çoğu blocked); cross-browser/visual kararlılığı; provenance VERIFIED değilse koşumun taze olduğunu; L1 PASS'in L2+ tamamlandığı anlamına geldiğini.</div>
</div>
${model.missingSources.length ? `<p class="warn">Eksik kaynak: ${h(model.missingSources.join(', '))} — ilgili bölüm(ler) üretilemedi.</p>` : ''}
</main></body></html>
`;
  assertHtmlSafe(html);
  const leaks = scanOutputLeaks(html);
  if (leaks.length) {
    const err = new Error(`Yönetici HTML sızıntı taraması: ${leaks.join(', ')}`);
    err.name = 'HtmlSafetyError';
    throw err;
  }
  return html;
}

/** Makine-okur JSON (deterministik). */
export function renderExecutiveJson(model) {
  return JSON.stringify(model, null, 2) + '\n';
}
