// @ts-check
/**
 * WP-SURFACE-RECONCILE (FAZ 4) — YÜZEY ENVANTERİ MODELİ (saf kütüphane / ADR-0021).
 *
 * AMAÇ: Kanonik `PRODUCT_SURFACES` registry'sini + kapsam sözleşmesi durumunu + cross-source
 * uzlaştırma sonucunu TEK, DETERMİNİSTİK, dürüst bir envanter modeline dönüştürmek. Bu ilk
 * dürüst envanter raporudur (HANDOFF FAZ 4 §7-8):
 *   - registered surfaces           (kanonik envanterdeki her yüzey)
 *   - observed but unregistered      (herhangi bir kaynakta görülüp registry'de olmayan → 0 hedef)
 *   - registered but no coverage     (üründe var, dedicated kapsam sözleşmesi YOK → NO_COVERAGE_CONTRACT)
 *   - dynamic / blocked              (reason-code'lu; sahte PASS üretmez)
 *   - deprecated / redirect
 *   - evidence source rollup
 *   - held candidates                (kanıtı yetersiz olduğu için BİLİNÇLİ eklenmeyenler; kaybolmaz)
 *
 * SAFLIK: Bu dosya YALNIZ saf fonksiyon içerir (dosya sistemi / CLI / prod yan etkisi YOK).
 * Böylece hem GERÇEK repo ağacını hem de TAMAMEN SENTETİK fixture'ları prod'a bağlanmadan
 * doğrular. TERİMİNOLOJİ: bu envanter "test edildi mi?" DEĞİL "üründe var mı + kayıtlı mı +
 * kapsam sözleşmesi var mı?" sorusunu yanıtlar. `main-navigation` DEDICATED kapsam sayılmaz.
 *
 * DÜRÜSTLÜK/GÜVENLİK: model YALNIZ rota/id/enum/kanıt-tipi taşır — token/cookie/e-posta/
 * telefon/kişi-adı/mutlak-yol YOK (self-check bunu fail-closed tarar). generatedAt varsayılan
 * `null`: envanter tamamen statik kaynaklardan (registry + coverage contracts) türetilir →
 * aynı girdi iki kez BIT-IDENTICAL çıktı verir (drift kapısı güvenilir).
 */
import { baselineKindForSurface, BASELINE_KINDS } from '../tests/contracts/registered-routes.js';

export const SCHEMA_VERSION = 1;

/** Envanter yüzey durumu sözlüğü (HANDOFF §4.4 alt kümesi; L2/runtime zenginleştirmesi FAZ 5). */
export const INVENTORY_STATUS = Object.freeze({
  COVERED_CONTRACT: 'COVERED_CONTRACT',         // dedicated kapsam sözleşmesi var
  NO_COVERAGE_CONTRACT: 'NO_COVERAGE_CONTRACT', // üründe var, dedicated sözleşme YOK
  BLOCKED: 'BLOCKED',                           // fixture/readonly-blocked/staging → koşulamaz
  REDIRECT: 'REDIRECT',                         // routeKind=redirect
  DEPRECATED: 'DEPRECATED',                     // üründen kaldırılma sürecinde
});

/**
 * Tek bir yüzeyin envanter durumunu türetir (fail-closed öncelik sırası).
 * @param {any} s @param {boolean} hasContract
 * @returns {string}
 */
export function surfaceStatus(s, hasContract) {
  if (s.lifecycle === 'deprecated') return INVENTORY_STATUS.DEPRECATED;
  if (s.routeKind === 'redirect') return INVENTORY_STATUS.REDIRECT;
  if (baselineKindForSurface(s) === BASELINE_KINDS.BLOCKED) return INVENTORY_STATUS.BLOCKED;
  return hasContract ? INVENTORY_STATUS.COVERED_CONTRACT : INVENTORY_STATUS.NO_COVERAGE_CONTRACT;
}

/** Sıralı sayaç nesnesi (deterministik anahtar sırası). */
function tally(items, keyFn) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const it of items) {
    const k = keyFn(it);
    out[k] = (out[k] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort((a, b) => a[0].localeCompare(b[0])));
}

/**
 * Envanter modelini kurar (SAF). Fırlatmaz; denetlenebilir deterministik model döndürür.
 *
 * @param {object} opts
 * @param {ReadonlyArray<any>} opts.surfaces  PRODUCT_SURFACES
 * @param {ReadonlyArray<string>} opts.dedicatedRoutes  DEDICATED (main-navigation OLMAYAN) kapsam rotaları
 * @param {Record<string,string[]>} [opts.contractsBySurfaceId]  surfaceId → dedicated sözleşme id'leri
 * @param {ReturnType<import('./surface-completeness-lib.mjs').reconcile>} opts.reconcile  completeness uzlaştırma modeli
 * @param {ReadonlyArray<{route:string, area:string, reason:string, evidenceRef:string}>} [opts.heldCandidates]  bilinçli eklenmeyenler
 * @param {string|null} [opts.generatedAt]
 */
export function buildInventoryModel(opts) {
  const surfaces = [...(opts.surfaces || [])].sort((a, b) => a.id.localeCompare(b.id));
  const dedicated = new Set(opts.dedicatedRoutes || []);
  const contractsBySurfaceId = opts.contractsBySurfaceId || {};
  const reconcile = opts.reconcile || {};
  const heldCandidates = [...(opts.heldCandidates || [])].sort((a, b) => a.route.localeCompare(b.route));

  const registeredSurfaces = surfaces.map((s) => {
    const hasContract = dedicated.has(s.route);
    const baseline = baselineKindForSurface(s);
    return {
      id: s.id,
      route: s.route,
      area: s.area,
      parentId: s.parentId ?? null,
      routeKind: s.routeKind,
      lifecycle: s.lifecycle,
      navigation: s.navigation,
      runtimePolicy: s.runtimePolicy,
      baseline,
      blockedReason: s.blockedReason ?? null,
      redirectTarget: s.redirectTarget ?? null,
      condition: s.condition ?? null,
      hasCoverageContract: hasContract,
      coverageContractIds: (contractsBySurfaceId[s.id] || []).slice().sort(),
      evidenceTypes: Array.isArray(s.evidence) ? [...new Set(s.evidence.map((e) => e && e.type).filter(Boolean))].sort() : [],
      status: surfaceStatus(s, hasContract),
    };
  });

  const byStatus = tally(registeredSurfaces, (r) => r.status);
  const noCoverage = registeredSurfaces.filter((r) => r.status === INVENTORY_STATUS.NO_COVERAGE_CONTRACT);
  const dynamicOrBlocked = registeredSurfaces.filter(
    (r) => r.routeKind === 'dynamic' || r.baseline === BASELINE_KINDS.BLOCKED
  );
  const deprecatedOrRedirect = registeredSurfaces.filter(
    (r) => r.status === INVENTORY_STATUS.DEPRECATED || r.status === INVENTORY_STATUS.REDIRECT
  );

  // evidence source rollup (kanıt-tipi → kaç yüzeyde geçiyor)
  const evidenceRollup = {};
  for (const r of registeredSurfaces) {
    for (const t of r.evidenceTypes) evidenceRollup[t] = (evidenceRollup[t] || 0) + 1;
  }

  // reconcile'dan gözlenen-ama-kayıtsız (0 hedef) + belirsiz
  const observedButUnregistered = (reconcile.unregisteredObserved || []).map((u) => ({
    source: u.kind, route: u.route, reason: u.reason,
  }));
  const ambiguous = (reconcile.ambiguous || []).map((a) => ({
    source: a.kind, route: a.route, candidates: a.candidates || [],
  }));

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: opts.generatedAt ?? null,
    provenance: {
      derivedFrom: 'PRODUCT_SURFACES + COVERAGE_CONTRACTS (static sources) + surface-completeness reconcile',
      reconcileSources: (reconcile.inventory && reconcile.inventory.sourceKinds) || [],
      reconcileObservations: (reconcile.totals && reconcile.totals.observations) || 0,
    },
    totals: {
      surfaces: registeredSurfaces.length,
      coveredContract: byStatus[INVENTORY_STATUS.COVERED_CONTRACT] || 0,
      noCoverageContract: byStatus[INVENTORY_STATUS.NO_COVERAGE_CONTRACT] || 0,
      blocked: byStatus[INVENTORY_STATUS.BLOCKED] || 0,
      redirect: byStatus[INVENTORY_STATUS.REDIRECT] || 0,
      deprecated: byStatus[INVENTORY_STATUS.DEPRECATED] || 0,
      dynamic: registeredSurfaces.filter((r) => r.routeKind === 'dynamic').length,
      observedButUnregistered: observedButUnregistered.length,
      ambiguous: ambiguous.length,
      heldCandidates: heldCandidates.length,
      byStatus,
      byArea: tally(registeredSurfaces, (r) => r.area),
      byRuntimePolicy: tally(registeredSurfaces, (r) => r.runtimePolicy),
      byBaseline: tally(registeredSurfaces, (r) => r.baseline),
    },
    sections: {
      registeredSurfaces,
      observedButUnregistered,
      ambiguous,
      registeredNoCoverageContract: noCoverage.map((r) => ({ id: r.id, route: r.route, area: r.area })),
      dynamicOrBlocked: dynamicOrBlocked.map((r) => ({ id: r.id, route: r.route, baseline: r.baseline, routeKind: r.routeKind, blockedReason: r.blockedReason })),
      deprecatedOrRedirect: deprecatedOrRedirect.map((r) => ({ id: r.id, route: r.route, status: r.status, redirectTarget: r.redirectTarget })),
      evidenceRollup: Object.fromEntries(Object.entries(evidenceRollup).sort((a, b) => a[0].localeCompare(b[0]))),
      heldCandidates,
    },
  };
}

/**
 * Envanter model değişmezlerini doğrular (SAF). Boş dizi = geçti.
 * @param {ReturnType<typeof buildInventoryModel>} model
 * @returns {string[]}
 */
export function validateInventory(model) {
  const errs = [];
  if (!model || typeof model !== 'object') return ['Envanter modeli nesne değil.'];
  if (model.schemaVersion !== SCHEMA_VERSION) errs.push(`schemaVersion beklenen ${SCHEMA_VERSION} değil: ${model.schemaVersion}`);
  const reg = model.sections && model.sections.registeredSurfaces;
  if (!Array.isArray(reg) || reg.length === 0) {
    errs.push('registeredSurfaces boş — sahte-yeşil reddedilir.');
    return errs;
  }
  // toplam tutarlılığı
  if (model.totals.surfaces !== reg.length) errs.push(`totals.surfaces (${model.totals.surfaces}) ≠ registeredSurfaces (${reg.length}).`);
  // her yüzey tam bir kez (tekil id + tekil rota)
  const ids = new Set(), routes = new Set();
  for (const r of reg) {
    if (ids.has(r.id)) errs.push(`Yinelenen envanter id: ${r.id}`);
    ids.add(r.id);
    if (routes.has(r.route)) errs.push(`Yinelenen envanter rota: ${r.route}`);
    routes.add(r.route);
    if (!Object.values(INVENTORY_STATUS).includes(r.status)) errs.push(`Bilinmeyen status '${r.status}': ${r.id}`);
  }
  // byStatus toplamı = surfaces
  const statusSum = Object.values(model.totals.byStatus || {}).reduce((a, b) => a + b, 0);
  if (statusSum !== reg.length) errs.push(`byStatus toplamı (${statusSum}) ≠ surfaces (${reg.length}).`);
  // determinizm: registeredSurfaces id'ye göre sıralı
  const sorted = [...reg].map((r) => r.id).sort();
  if (JSON.stringify(reg.map((r) => r.id)) !== JSON.stringify(sorted)) errs.push('registeredSurfaces id sırası deterministik değil.');
  // NO_COVERAGE bölümü ↔ status tutarlılığı
  const noCovStatus = reg.filter((r) => r.status === INVENTORY_STATUS.NO_COVERAGE_CONTRACT).length;
  if ((model.sections.registeredNoCoverageContract || []).length !== noCovStatus) {
    errs.push('registeredNoCoverageContract bölümü status ile tutarsız.');
  }
  // güvenlik/gizlilik: model dizesinde secret/PII/mutlak-yol sızıntısı YOK
  errs.push(...scanForLeaks(model));
  return errs;
}

/** Model JSON'unda kaba secret/PII/mutlak-yol sızıntısı tarar (SAF). */
export function scanForLeaks(model) {
  const errs = [];
  const json = JSON.stringify(model);
  const patterns = [
    [/[Bb]earer\s+[A-Za-z0-9._-]+/, 'Bearer token'],
    [/[Aa]uthorization/, 'Authorization'],
    [/[Cc]ookie/, 'cookie'],
    [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, 'e-posta'],
    [/\+?\d[\d\s()-]{9,}\d/, 'telefon'],
    [/\/(Users|home)\/[A-Za-z0-9._-]+\//, 'mutlak yerel yol'],
    [/[A-Za-z]:\\\\/, 'windows mutlak yol'],
  ];
  for (const [re, label] of patterns) {
    if (re.test(json)) errs.push(`Envanter modelinde olası ${label} sızıntısı.`);
  }
  return errs;
}

/** Deterministik JSON render. */
export function renderInventoryJson(model) {
  return JSON.stringify(model, null, 2) + '\n';
}

/** Markdown tablo hücresini kaçır. */
const cell = (v) => String(v ?? '').replace(/\|/g, '\\|');

/** İnsan-okur Markdown render (deterministik). */
export function renderInventoryMd(model) {
  const t = model.totals;
  const L = [];
  L.push('# Vomenta — Yüzey Envanteri (SURFACE-INVENTORY)');
  L.push('');
  L.push('> **OTOMATİK ÜRETİLDİ** — `tools/generate-surface-inventory.mjs`. ELLE DÜZENLEMEYİN.');
  L.push('> Kaynak: kanonik `tests/contracts/product-surfaces.js` (ÜRÜN VARLIĞI) + kapsam sözleşmeleri');
  L.push('> (`tested-pages.js`) + surface-completeness uzlaştırması. WP-SURFACE-RECONCILE / FAZ 4 / ADR-0021.');
  L.push('');
  L.push('Bu envanter "test edildi mi?" DEĞİL şu üç ayrı soruyu yanıtlar: (1) üründe hangi yüzeyler');
  L.push('var? (2) hangileri kanonik registry\'ye kayıtlı? (3) hangilerinde *dedicated* kapsam');
  L.push('sözleşmesi var? `main-navigation` dedicated kapsam SAYILMAZ. `✅` ile stil/runtime/feature');
  L.push('kapsamı KARIŞTIRILMAZ (o ayrım TEST_STYLE_MATRIX / SURFACE-DEPTH / SAYFA-TEST-SONUCLARI\'nda).');
  L.push('');
  L.push('## Özet');
  L.push('');
  L.push(`- **Kayıtlı yüzey:** ${t.surfaces}`);
  L.push(`- **Kapsam sözleşmesi olan:** ${t.coveredContract} · **NO_COVERAGE_CONTRACT:** ${t.noCoverageContract}`);
  L.push(`- **Dynamic:** ${t.dynamic} · **BLOCKED (fixture/rol/staging):** ${t.blocked} · **REDIRECT:** ${t.redirect} · **DEPRECATED:** ${t.deprecated}`);
  L.push(`- **Observed-but-unregistered:** ${t.observedButUnregistered} · **Ambiguous:** ${t.ambiguous} · **Held (PR-only/unverified):** ${t.heldCandidates}`);
  L.push(`- **Uzlaştırılan kaynak:** ${model.provenance.reconcileSources.length} (${model.provenance.reconcileObservations} gözlem)`);
  L.push('');
  L.push('### Alan (area) dağılımı');
  L.push('');
  L.push('| Alan | Yüzey |');
  L.push('|---|--:|');
  for (const [area, n] of Object.entries(t.byArea)) L.push(`| ${cell(area)} | ${n} |`);
  L.push('');
  L.push('### Runtime politikası dağılımı');
  L.push('');
  L.push('| runtimePolicy | Yüzey |');
  L.push('|---|--:|');
  for (const [p, n] of Object.entries(t.byRuntimePolicy)) L.push(`| ${cell(p)} | ${n} |`);
  L.push('');

  L.push('## 1. Kayıtlı yüzeyler (registered surfaces)');
  L.push('');
  L.push('| id | route | area | routeKind | lifecycle | nav | runtimePolicy | baseline | contract? | status |');
  L.push('|---|---|---|---|---|---|---|---|:--:|---|');
  for (const r of model.sections.registeredSurfaces) {
    L.push(`| ${cell(r.id)} | ${cell(r.route)} | ${cell(r.area)} | ${cell(r.routeKind)} | ${cell(r.lifecycle)} | ${cell(r.navigation)} | ${cell(r.runtimePolicy)} | ${cell(r.baseline)} | ${r.hasCoverageContract ? '✔' : '—'} | ${cell(r.status)} |`);
  }
  L.push('');

  L.push('## 2. Observed but unregistered (hedef: 0)');
  L.push('');
  if (model.sections.observedButUnregistered.length === 0 && model.sections.ambiguous.length === 0) {
    L.push('Yok — repo içi tüm rota kaynakları kanonik registry ile uzlaştı (0 UNREGISTERED_OBSERVED, 0 AMBIGUOUS).');
  } else {
    L.push('| source | route | reason |');
    L.push('|---|---|---|');
    for (const u of model.sections.observedButUnregistered) L.push(`| ${cell(u.source)} | ${cell(u.route)} | ${cell(u.reason)} |`);
    for (const a of model.sections.ambiguous) L.push(`| ${cell(a.source)} | ${cell(a.route)} | AMBIGUOUS (${cell(a.candidates.join(', '))}) |`);
  }
  L.push('');

  L.push('## 3. Registered but NO_COVERAGE_CONTRACT');
  L.push('');
  L.push('Üründe var ve kayıtlı; ama *dedicated* kapsam sözleşmesi YOK. Kaybolmaz — dürüstçe eksik');
  L.push('görünür (baseline smoke\'u alır, matriste `NO_COVERAGE_CONTRACT`). Dedicated kapsam FAZ 6 dalgalarında yazılır.');
  L.push('');
  if (model.sections.registeredNoCoverageContract.length === 0) {
    L.push('Yok.');
  } else {
    L.push('| id | route | area |');
    L.push('|---|---|---|');
    for (const r of model.sections.registeredNoCoverageContract) L.push(`| ${cell(r.id)} | ${cell(r.route)} | ${cell(r.area)} |`);
  }
  L.push('');

  L.push('## 4. Dynamic / BLOCKED (reason-code\'lu; sahte PASS üretmez)');
  L.push('');
  if (model.sections.dynamicOrBlocked.length === 0) {
    L.push('Yok.');
  } else {
    L.push('| id | route | routeKind | baseline | blockedReason |');
    L.push('|---|---|---|---|---|');
    for (const r of model.sections.dynamicOrBlocked) L.push(`| ${cell(r.id)} | ${cell(r.route)} | ${cell(r.routeKind)} | ${cell(r.baseline)} | ${cell(r.blockedReason || '—')} |`);
  }
  L.push('');

  L.push('## 5. Deprecated / Redirect (alias)');
  L.push('');
  if (model.sections.deprecatedOrRedirect.length === 0) {
    L.push('Yok. (Not: `/voice` → `/voice/live` istemci-tarafı yönlenmesi taşır; `/voice` main-nav hub olarak');
    L.push('kayıtlı, `/voice/live` gerçek içerik yüzeyidir — redirect ayrı bir kanonik yüzey olarak modellenmemiştir.)');
  } else {
    L.push('| id | route | status | redirectTarget |');
    L.push('|---|---|---|---|');
    for (const r of model.sections.deprecatedOrRedirect) L.push(`| ${cell(r.id)} | ${cell(r.route)} | ${cell(r.status)} | ${cell(r.redirectTarget || '—')} |`);
  }
  L.push('');

  L.push('## 6. Held candidates — bilinçli EKLENMEYEN (kaybolmaz)');
  L.push('');
  L.push('Kanıtı yetersiz olduğu için registry\'ye ALINMADI. "Var olmayan eski route\'u sırf PR\'da');
  L.push('yazıyor diye active ekleme" (HANDOFF FAZ 4). Görünür kalır; gelecek fazda canlı doğrulanır.');
  L.push('');
  if (model.sections.heldCandidates.length === 0) {
    L.push('Yok.');
  } else {
    L.push('| route | area | reason | evidenceRef |');
    L.push('|---|---|---|---|');
    for (const h of model.sections.heldCandidates) L.push(`| ${cell(h.route)} | ${cell(h.area)} | ${cell(h.reason)} | ${cell(h.evidenceRef)} |`);
  }
  L.push('');

  L.push('## 7. Evidence source rollup (ürün-varlık kanıt tipi → kaç yüzey)');
  L.push('');
  L.push('| evidence type | yüzey |');
  L.push('|---|--:|');
  for (const [t2, n] of Object.entries(model.sections.evidenceRollup)) L.push(`| ${cell(t2)} | ${n} |`);
  L.push('');
  return L.join('\n') + '\n';
}
