// @ts-check
/**
 * WP-SURFACE (FAZ 4) — ROTA KAPSAM DERİNLİĞİ MOTORU (saf kütüphane).
 *
 * Kayıtlı her rota için L1–L5 kapsam DERİNLİĞİNİ, sabit sayı gömmeden ve envanteri
 * şişirmeden, denetlenebilir biçimde türetir. Bu dosya YALNIZ saf fonksiyon içerir
 * (dosya sistemi/CLI/prod yan etkisi yok) → `self-check-surface-depth.mjs` tümünü
 * TAMAMEN SENTETİK fixture'larla, production'a bağlanmadan doğrular.
 *
 * DÜRÜSTLÜK SÖZLEŞMELERİ (HANDOFF §4):
 * - Rota evreni = REGISTERED_ROUTES (tek gerçeklik kaynağı). Her rota TAM BİR KEZ.
 * - L1 = GERÇEK RUNTIME sonucu (`TEST-SONUCLARI.json → pages[].baselineStatus`).
 *   Runtime sonucu olmayan rota L1 PROVEN olamaz (§4.9-3).
 * - L2 iki AYRI kanıt katmanına bölünür (statik varlık ≠ runtime sonucu, §4.4):
 *     • STİL SÖZLEŞMESİ (tag-destekli): a11y/i18n/layout/errorpath/keyboard/clean/
 *       deeplink/visual/perf/data/export. Kanıt = Playwright etiketi + sözleşme
 *       ilişkisi (§4.7). Durum COVERED/NOT_COVERED/NOT_APPLICABLE.
 *     • ETKİLEŞİM DERİNLİĞİ (sekme/filtre/tablo/pagination/boş/loading): rota düzeyi
 *       makine-okur işaret YOKTUR → asla "COVERED" iddia edilmez. Arketip bileşeni
 *       ima ediyorsa `UNVERIFIED` (reason NO_MACHINE_SIGNAL); etmiyorsa NOT_APPLICABLE.
 *   Böylece bir rota "L2 DEEP" (tam etkileşim derinliği kanıtlı) OLMADAN yeşile
 *   boyanamaz; style-coverage kapısı yeşil diye 55/55 "tamam" YAZILMAZ. Bir zorunlu
 *   boyut eksikken/UNVERIFIED iken L2 COMPLETE olamaz (§4.9-4).
 * - Bir boyut sayfada geçerli değilse `NOT_APPLICABLE` + gerekçe/reasonCode; sessiz
 *   N/A yoktur (§4.6). Bilinmeyen status/reasonCode reddedilir (§4.9-9).
 * - L3 production read-only kanıtıyla COMPLETE olamaz → hasWrites ise BLOCKED
 *   (STAGING_REQUIRED). L4/L5 rol/tenant/provider altyapısı olmadan COMPLETE olamaz →
 *   uniform BLOCKED (§4.9-5/6/7).
 * - Test↔rota ilişkisi YALNIZ (a) exact `[route:]` işareti veya (b) sözleşme
 *   (`TESTED_PAGES.routes ∋ R` ve specFile ∈ o sözleşme) ile kurulur — ikisi de açık
 *   ve deterministik (§4.7). Eşlenemeyen test HİÇBİR rotayı yeşile boyayamaz (§4.9-10).
 * - Ham hata/stack/mutlak yol/secret çıktıya taşınmaz (scanOutputLeaks kapısı).
 */
import { basename } from 'node:path';
import { parseRouteMarker } from '../tests/contracts/registered-routes.js';

export { scanOutputLeaks } from './runtime-report-lib.mjs';

export const SCHEMA_VERSION = 1;

/** Kanonik seviye sırası. */
export const LEVELS = Object.freeze(['L1', 'L2', 'L3', 'L4', 'L5']);

/** Kanonik durum sözlüğü (karıştırılamaz — §4.5). */
export const STATUS = Object.freeze({
  PROVEN: 'PROVEN', // L1: gerçek runtime PASS/FLAKY
  COMPLETE: 'COMPLETE', // L2: stil sözleşmesi + tüm geçerli etkileşim boyutu kanıtlı
  PARTIAL: 'PARTIAL', // L2: stil sözleşmesi karşılandı, etkileşim derinliği kanıtsız
  COVERED: 'COVERED', // boyut: statik test var (etiket + sözleşme)
  UNVERIFIED: 'UNVERIFIED', // boyut geçerli ama rota düzeyi makine-okur kanıt yok
  NOT_COVERED: 'NOT_COVERED', // zorunlu ama kanıt yok (gerçek boşluk)
  BLOCKED: 'BLOCKED', // altyapı (staging/rol/provider) olmadan kanıtlanamaz
  NOT_APPLICABLE: 'NOT_APPLICABLE', // arketip/beyan gereği geçerli değil (gerekçeli)
  NOT_RUN: 'NOT_RUN', // envanterde var, runtime sonucu yok
  FAIL: 'FAIL', // L1 runtime FAIL
  FLAKY: 'FLAKY', // L1 runtime retry-pass
});
const STATUS_VALUES = new Set(Object.values(STATUS));

/** Kanonik reasonCode sözlüğü (BLOCKED/NOT_APPLICABLE/NOT_RUN/UNVERIFIED için zorunlu). */
export const REASON_CODES = Object.freeze({
  NO_RUNTIME_RESULT: 'NO_RUNTIME_RESULT',
  STAGING_REQUIRED: 'STAGING_REQUIRED',
  NO_WRITE_SURFACE: 'NO_WRITE_SURFACE',
  ROLE_ACCOUNTS_REQUIRED: 'ROLE_ACCOUNTS_REQUIRED',
  PROVIDER_HARNESS_REQUIRED: 'PROVIDER_HARNESS_REQUIRED',
  ARCHETYPE_NOT_DECLARED: 'ARCHETYPE_NOT_DECLARED',
  DECLARED_NA: 'DECLARED_NA',
  NO_MACHINE_SIGNAL: 'NO_MACHINE_SIGNAL',
  IX_SIGNAL_PRESENT: 'IX_SIGNAL_PRESENT', // etkileşim boyutu için makine-okur işaret (WP-L2-WAVE-1 / ADR-0014)
});
const REASON_VALUES = new Set(Object.values(REASON_CODES));

/** highestProvenLevel değerleri. */
export const HIGHEST_LEVELS = Object.freeze(['L0', 'L1', 'L2_STYLE', 'L2_DEEP']);

/**
 * L1 runtime durum → seviye durumu eşlemesi. PROVEN yalnız PASS/FLAKY'de.
 * @param {string} baselineStatus
 */
function mapL1(baselineStatus) {
  switch (String(baselineStatus)) {
    case 'PASS':
      return { status: STATUS.PROVEN, runtimeStatus: 'PASS' };
    case 'FLAKY':
      return { status: STATUS.PROVEN, runtimeStatus: 'FLAKY' }; // yüzey yüklendi (retry-pass)
    case 'FAIL':
      return { status: STATUS.FAIL, runtimeStatus: 'FAIL' };
    case 'BLOCKED':
      return { status: STATUS.BLOCKED, runtimeStatus: 'BLOCKED' };
    default:
      return { status: STATUS.NOT_RUN, runtimeStatus: 'NOT_RUN' };
  }
}

// ── L2 stil-sözleşmesi (style-coverage.mjs ile SENKRON) ───────────────────────
/** Baş '@' ve sondaki noktalama temizlenir (style-coverage `norm` ile aynı). */
export const normTag = (t) => String(t).replace(/^@/, '').replace(/[^\w-]+$/, '');

/**
 * STİL boyutları = tag-destekli read-only yüzey stilleri. `smoke/regression/critical/
 * known-bug/public/route-baseline` yapısaldır (boyut değil); `mutation` L3'e aittir.
 */
export const STYLE_DIMENSIONS = Object.freeze([
  'i18n', 'a11y', 'layout', 'clean', 'deeplink', 'keyboard', 'errorpath', 'visual', 'perf', 'data', 'export',
]);
/** Her sayfada zorunlu stil boyutları (style BASELINE ∩ L2). */
const BASELINE_STYLE = Object.freeze(['i18n', 'a11y', 'layout', 'clean', 'deeplink']);
/** Arketipe bağlı zorunlu stil boyutları (mutation HARİÇ → L3). */
const CONDITIONAL_STYLE = Object.freeze([
  { tag: 'keyboard', when: (a) => a.hasDialogs || a.hasTabs },
  { tag: 'errorpath', when: (a) => a.hasData },
  { tag: 'visual', when: (a) => a.hasStableUI },
  { tag: 'perf', when: (a) => a.hasCharts },
  { tag: 'data', when: (a) => a.hasNumericKpis },
  { tag: 'export', when: (a) => a.hasExport },
]);

/**
 * ETKİLEŞİM boyutları = read-only kullanıcı davranışı (§4.3/§4.6). WP-L2-WAVE-1 / ADR-0014
 * ile her boyutun bir `@ix-*` makine-okur işareti vardır (INTERACTION_TAG): ilgili işareti
 * taşıyan dedicated etkileşim testi VARSA boyut COVERED (IX_SIGNAL_PRESENT), yoksa dürüstçe
 * UNVERIFIED (NO_MACHINE_SIGNAL). Uygulanabilirlik arketipten okunur; yüzeyde bulunmayan
 * boyut `naInteraction` ile açık gerekçeyle NOT_APPLICABLE (DECLARED_NA). Uygulanamaz/N-A
 * boyut için işaret = sahte kanıt (misdeclared) → invariant hatası. Sahte COVERED üretilmez.
 */
export const INTERACTION_DIMENSIONS = Object.freeze([
  'tabs', 'search-filter', 'table-list', 'pagination-sort', 'empty-state', 'loading-state',
]);
const INTERACTION_APPLICABILITY = Object.freeze({
  'tabs': (a) => Boolean(a.hasTabs),
  'search-filter': (a) => Boolean(a.hasData),
  'table-list': (a) => Boolean(a.hasData),
  'pagination-sort': (a) => Boolean(a.hasData),
  'empty-state': (a) => Boolean(a.hasData),
  'loading-state': (a) => Boolean(a.hasData),
});

/**
 * Her etkileşim boyutunun MAKİNE-OKUR İŞARET etiketi (WP-L2-WAVE-1 / ADR-0014).
 * FAZ 4'te bu işaret YOKTU → hiçbir boyut COVERED olamıyordu. FAZ 5 bu işareti
 * ekler: bir dedicated (yüzey-özgü arketip beyanlı) rotanın etkileşim spec'i ilgili
 * `@ix-*` etiketini taşıyorsa o boyut COVERED olur. Kanıt standardı stil boyutlarıyla
 * AYNIDIR: etiket = "o boyut için gerçek bir etkileşim testi VAR" (bu koşumda geçti
 * demek değil). Etiketsiz boyut dürüstçe UNVERIFIED kalır; uygulanamaz boyut için
 * etiket = yüzeyde olmayan bileşen iddiası (sahte kanıt) → hata.
 */
export const INTERACTION_TAG = Object.freeze({
  'tabs': 'ix-tabs',
  'search-filter': 'ix-filter',
  'table-list': 'ix-table',
  'pagination-sort': 'ix-pagination',
  'empty-state': 'ix-empty',
  'loading-state': 'ix-loading',
});
export const INTERACTION_TAGS = Object.freeze(Object.values(INTERACTION_TAG));

/**
 * Playwright `--list --reporter=json` çıktısından etiket indekslerini kurar
 * (style-coverage.mjs ile AYNI desen; koşum yok, yalnız listeleme).
 * @param {any} listReport
 * @returns {{ tagsByFile: Map<string,Set<string>>, tagsByRoute: Map<string,Set<string>>, allTags: Set<string> }}
 */
export function buildTagIndex(listReport) {
  const tagsByFile = new Map();
  const tagsByRoute = new Map();
  const allTags = new Set();
  const walk = (suite) => {
    for (const sp of suite.specs || []) {
      const file = basename(String(sp.file || ''));
      const set = tagsByFile.get(file) || new Set();
      for (const t of sp.tags || []) {
        const n = normTag(t);
        set.add(n);
        allTags.add(n);
      }
      tagsByFile.set(file, set);
      const marker = parseRouteMarker(`${suite.title || ''} ${sp.title || ''}`);
      if (marker) {
        const rs = tagsByRoute.get(marker) || new Set();
        for (const t of sp.tags || []) rs.add(normTag(t));
        tagsByRoute.set(marker, rs);
      }
    }
    for (const child of suite.suites || []) walk(child);
  };
  for (const s of (listReport && listReport.suites) || []) walk(s);
  return { tagsByFile, tagsByRoute, allTags };
}

/**
 * Rota → sözleşme meta indeksi. Her rotayı, `routes` alanında o rotayı LİSTELEYEN
 * TESTED_PAGES sözleşmelerine bağlar (açık, deterministik ilişki — §4.7).
 * @param {ReadonlyArray<any>} testedPages
 */
function buildRouteMeta(testedPages) {
  /** @type {Map<string,{pageIds:string[],specFiles:Set<string>,archetype:Record<string,boolean>,naStyles:Record<string,string>,dedicated:boolean}>} */
  const idx = new Map();
  for (const p of testedPages) {
    for (const route of p.routes || []) {
      if (!idx.has(route)) {
        idx.set(route, { pageIds: [], specFiles: new Set(), archetype: {}, naStyles: {}, naInteraction: {}, dedicated: false });
      }
      const e = idx.get(route);
      if (!e.pageIds.includes(p.id)) e.pageIds.push(p.id);
      for (const f of p.specFiles || []) e.specFiles.add(basename(String(f)));
      for (const [k, v] of Object.entries(p.archetype || {})) e.archetype[k] = e.archetype[k] || Boolean(v);
      for (const [k, v] of Object.entries(p.naStyles || {})) e.naStyles[normTag(k)] = String(v);
      // Yüzeyde bulunmayan etkileşim boyutları açık gerekçeyle N/A (naStyles deseni; §5.4).
      for (const [k, v] of Object.entries(p.naInteraction || {})) e.naInteraction[String(k)] = String(v);
      // Genel `routeLevelBaseline` (main-navigation) sözleşmesi yüzey-özgü arketip TAŞIMAZ;
      // yüzeyin bileşenlerini (tablo/filtre/sekme) ne kanıtlar ne de yok sayar. Bir rotanın
      // arketipine güvenmek için EN AZ BİR dedicated (routeLevelBaseline OLMAYAN) sözleşme gerekir.
      if (!p.routeLevelBaseline) e.dedicated = true;
    }
  }
  return idx;
}

/**
 * Bilinen bug registry'sini EXACT rota eşlemesiyle indeksler (parent/child otomatik
 * eşleşmez — §4.4).
 * @param {ReadonlyArray<any>} bugs
 * @param {ReadonlyArray<string>} registeredRoutePaths
 */
function indexBugs(bugs, registeredRoutePaths) {
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

/** Bir rotanın STİL boyutlarını hesaplar. */
function computeStyleTier(present, archetype, naStyles) {
  const required = new Set(BASELINE_STYLE);
  for (const c of CONDITIONAL_STYLE) if (c.when(archetype)) required.add(c.tag);

  const dimensions = {};
  const requiredList = [];
  let coveredOrExempt = 0; // stil sözleşmesi karşılama sayacı (COVERED | gerekçeli N/A)
  let gaps = 0; // gerçek boşluk (NOT_COVERED)
  for (const dim of STYLE_DIMENSIONS) {
    const isRequired = required.has(dim);
    const isPresent = present.has(dim);
    const na = naStyles[dim];
    if (isRequired) requiredList.push(dim);
    if (isPresent) {
      dimensions[dim] = { status: STATUS.COVERED, required: isRequired };
      if (isRequired) coveredOrExempt++;
    } else if (na) {
      // Gerekçeli N/A: stil sözleşmesini KARŞILAR (style-coverage ile aynı; eksik sayılmaz).
      dimensions[dim] = { status: STATUS.NOT_APPLICABLE, required: isRequired, reasonCode: REASON_CODES.DECLARED_NA, reason: na };
      if (isRequired) coveredOrExempt++;
    } else if (isRequired) {
      dimensions[dim] = { status: STATUS.NOT_COVERED, required: true };
      gaps++;
    } else {
      dimensions[dim] = { status: STATUS.NOT_APPLICABLE, required: false, reasonCode: REASON_CODES.ARCHETYPE_NOT_DECLARED };
    }
  }
  const contractMet = requiredList.length > 0 && gaps === 0;
  return { dimensions, requiredList, requiredCount: requiredList.length, coveredOrExempt, gaps, contractMet };
}

/**
 * Bir rotanın ETKİLEŞİM boyutlarını hesaplar. Rota düzeyi makine-okur işaret YOKTUR →
 * hiçbir boyut COVERED üretilmez; en iyi ihtimalle `UNVERIFIED` (bileşen var/olabilir,
 * bağımsız doğrulanamaz). Uygulanabilirlik YALNIZ dedicated (yüzey-özgü) arketipten
 * okunur; dedicated arketip yoksa bileşenlerin yokluğu kanıtlanamaz → TÜM boyutlar
 * UNVERIFIED (yanlışlıkla NOT_APPLICABLE damgalanmaz).
 * @param {Record<string,boolean>} archetype
 * @param {boolean} dedicated rota en az bir yüzey-özgü (routeLevelBaseline olmayan) sözleşmeye mi ait
 */
function computeInteractionTier(archetype, dedicated, presentTags = new Set(), naInteraction = {}) {
  const dimensions = {};
  const applicable = [];
  const presentSignals = [];
  const misdeclaredSignals = []; // uygulanamaz/N-A boyut için işaret = sahte kanıt
  for (const dim of INTERACTION_DIMENSIONS) {
    const hasSignal = presentTags.has(INTERACTION_TAG[dim]);
    // Açık N/A yalnız dedicated arketipte anlamlı (genel baseline yüzey bileşeni beyan etmez).
    const declaredNa = dedicated && Object.prototype.hasOwnProperty.call(naInteraction, dim);
    const archetypeApplies = dedicated ? INTERACTION_APPLICABILITY[dim](archetype) : true; // dedicated yoksa yokluk kanıtlanamaz
    if (declaredNa) {
      dimensions[dim] = { status: STATUS.NOT_APPLICABLE, reasonCode: REASON_CODES.DECLARED_NA };
      if (hasSignal) misdeclaredSignals.push(INTERACTION_TAG[dim]); // N/A boyut için işaret = çelişki
    } else if (archetypeApplies) {
      applicable.push(dim);
      // İşaret YALNIZ dedicated (yüzey-özgü arketip beyanlı) rotada COVERED sayılır; aksi
      // halde uygulanabilirlik bağımsız bilinmediğinden dürüstçe UNVERIFIED kalır.
      if (dedicated && hasSignal) {
        dimensions[dim] = { status: STATUS.COVERED, reasonCode: REASON_CODES.IX_SIGNAL_PRESENT, signal: INTERACTION_TAG[dim] };
        presentSignals.push(INTERACTION_TAG[dim]);
      } else {
        dimensions[dim] = { status: STATUS.UNVERIFIED, reasonCode: REASON_CODES.NO_MACHINE_SIGNAL };
      }
    } else {
      dimensions[dim] = { status: STATUS.NOT_APPLICABLE, reasonCode: REASON_CODES.ARCHETYPE_NOT_DECLARED };
      if (hasSignal) misdeclaredSignals.push(INTERACTION_TAG[dim]); // yüzeyde olmayan bileşen için işaret
    }
  }
  const covered = applicable.filter((d) => dimensions[d].status === STATUS.COVERED).length;
  const verified = applicable.length > 0 && covered === applicable.length;
  return {
    dimensions, applicable, applicableCount: applicable.length, coveredCount: covered, verified,
    presentSignals: presentSignals.sort(), misdeclaredSignals: misdeclaredSignals.sort(),
  };
}

/**
 * TAM kapsam-derinliği modelini kurar. Sayılar TÜRETİLİR (koda sabitlenmez).
 *
 * @param {object} opts
 * @param {ReadonlyArray<{path:string,heading:string|null}>} opts.registeredRoutes
 * @param {ReadonlyArray<any>} opts.testedPages
 * @param {ReadonlyArray<any>} opts.knownBugs
 * @param {any} opts.runtimeReport TEST-SONUCLARI.json parse'ı
 * @param {Map<string,Set<string>>} opts.tagsByRoute
 * @param {Map<string,Set<string>>} opts.tagsByFile
 * @param {string} opts.generatedAt
 */
export function buildSurfaceModel(opts) {
  const { registeredRoutes, testedPages, knownBugs, runtimeReport, tagsByRoute, tagsByFile, generatedAt } = opts;
  if (!Array.isArray(registeredRoutes) || registeredRoutes.length === 0) {
    throw new Error('registeredRoutes boş olamaz.');
  }
  const routePaths = registeredRoutes.map((r) => r.path);
  const routeMeta = buildRouteMeta(testedPages);
  const bugIdx = indexBugs(knownBugs, routePaths);

  const runtimeByRoute = new Map();
  for (const p of (runtimeReport && runtimeReport.pages) || []) runtimeByRoute.set(p.route, p);

  const pages = [];
  for (const { path: route, heading } of registeredRoutes) {
    const meta = routeMeta.get(route) || { pageIds: [], specFiles: new Set(), archetype: {}, naStyles: {}, naInteraction: {} };

    // ── L1: runtime ──
    const rt = runtimeByRoute.get(route);
    let l1;
    if (!rt) {
      l1 = { status: STATUS.NOT_RUN, reasonCode: REASON_CODES.NO_RUNTIME_RESULT, runtimeStatus: null, statusReason: null, specFiles: [] };
    } else {
      const m = mapL1(rt.baselineStatus);
      l1 = {
        status: m.status,
        runtimeStatus: m.runtimeStatus,
        statusReason: String(rt.statusReason || ''),
        specFiles: Array.from(new Set((rt.specFiles || []).map((f) => basename(String(f))))).sort(),
      };
      if (m.status === STATUS.NOT_RUN) l1.reasonCode = REASON_CODES.NO_RUNTIME_RESULT;
      else if (m.status === STATUS.BLOCKED) l1.reasonCode = REASON_CODES.NO_RUNTIME_RESULT;
    }

    // ── L2: iki kanıt katmanı ──
    const present = new Set(tagsByRoute.get(route) || []);
    for (const f of meta.specFiles) {
      const set = tagsByFile.get(f);
      if (set) for (const t of set) present.add(t);
    }
    const style = computeStyleTier(present, meta.archetype, meta.naStyles);
    const interaction = computeInteractionTier(meta.archetype, meta.dedicated, present, meta.naInteraction);

    let l2Status;
    if (!style.contractMet) l2Status = STATUS.NOT_COVERED; // gerçek stil boşluğu
    else if (interaction.verified) l2Status = STATUS.COMPLETE; // stil + tüm etkileşim kanıtlı
    else l2Status = STATUS.PARTIAL; // stil karşılandı, etkileşim derinliği kanıtsız

    const l2 = {
      status: l2Status,
      style: {
        contractMet: style.contractMet,
        requiredDimensions: style.requiredList,
        coveredOrExempt: style.coveredOrExempt,
        requiredCount: style.requiredCount,
        gaps: style.gaps,
        dimensions: style.dimensions,
      },
      interaction: {
        verified: interaction.verified,
        applicableDimensions: interaction.applicable,
        applicableCount: interaction.applicableCount,
        coveredCount: interaction.coveredCount,
        surfaceArchetype: meta.dedicated, // false → uygulanabilirlik bilinmiyor (yalnız genel baseline)
        presentSignals: interaction.presentSignals, // COVERED'ı destekleyen @ix-* işaretleri
        misdeclaredSignals: interaction.misdeclaredSignals, // uygulanamaz boyut için işaret (hata sinyali)
        dimensions: interaction.dimensions,
      },
    };

    // ── L3: mutation (production read-only → asla COMPLETE) ──
    const hasWrites = Boolean(meta.archetype.hasWrites);
    const l3 = hasWrites
      ? { status: STATUS.BLOCKED, reasonCode: REASON_CODES.STAGING_REQUIRED, mutationSpecStatic: present.has('mutation') }
      : { status: STATUS.NOT_APPLICABLE, reasonCode: REASON_CODES.NO_WRITE_SURFACE };

    // ── L4/L5: altyapı yok → uniform BLOCKED ──
    const l4 = { status: STATUS.BLOCKED, reasonCode: REASON_CODES.ROLE_ACCOUNTS_REQUIRED };
    const l5 = { status: STATUS.BLOCKED, reasonCode: REASON_CODES.PROVIDER_HARNESS_REQUIRED };

    // ── highestProvenLevel ──
    let highest;
    if (l1.status !== STATUS.PROVEN) highest = 'L0';
    else if (l2.status === STATUS.COMPLETE) highest = 'L2_DEEP';
    else if (l2.status === STATUS.PARTIAL) highest = 'L2_STYLE';
    else highest = 'L1'; // stil boşluğu var ama açılış kanıtlı

    pages.push({
      route,
      heading: heading ?? null,
      contracts: [...meta.pageIds].sort(),
      highestProvenLevel: highest,
      levels: { L1: l1, L2: l2, L3: l3, L4: l4, L5: l5 },
      findings: (bugIdx.byRoute.get(route) || []).slice().sort((a, b) => a.id.localeCompare(b.id)),
    });
  }

  const unmappedTests = ((runtimeReport && runtimeReport.unmappedTests) || []).map((u) => ({
    file: basename(String(u.file || '')),
    routeMarker: u.routeMarker ? String(u.routeMarker) : null,
    status: String(u.status || ''),
  }));

  const totals = deriveTotals(pages, registeredRoutes.length);

  const source = {
    sourceCommit: (runtimeReport && runtimeReport.source && runtimeReport.source.commitSha) || null,
    environment: (runtimeReport && runtimeReport.source && runtimeReport.source.environment) || null,
    browser: (runtimeReport && runtimeReport.source && runtimeReport.source.browser) || null,
    runtimeGeneratedAt: (runtimeReport && runtimeReport.generatedAt) || null,
  };

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    source,
    inventory: {
      registeredRoutes: registeredRoutes.length,
      testedPagesContracts: testedPages.length,
      knownBugs: bugIdx.totals,
    },
    totals,
    pages,
    unmappedTests,
    unmappedFindings: bugIdx.unmappedFindings.slice().sort((a, b) => a.id.localeCompare(b.id)),
  };
}

/** Rota satırlarından yönetici özeti sayıları türetir (SABİT DEĞİL). */
function deriveTotals(pages, routeCount) {
  const t = {
    registeredRoutes: routeCount,
    l1Proven: 0,
    l1NotProven: 0,
    l2StyleContractMet: 0,
    l2StyleGap: 0,
    l2Complete: 0,
    l2Partial: 0,
    l2NotCovered: 0,
    interactionUnverifiedRoutes: 0,
    l3Blocked: 0,
    l3NotApplicable: 0,
    l4Blocked: 0,
    l5Blocked: 0,
    highestLevel: { L0: 0, L1: 0, L2_STYLE: 0, L2_DEEP: 0 },
    routesWithFindings: 0,
    openFindingsOnRoutes: 0,
  };
  for (const p of pages) {
    if (p.levels.L1.status === STATUS.PROVEN) t.l1Proven++;
    else t.l1NotProven++;
    if (p.levels.L2.style.contractMet) t.l2StyleContractMet++;
    else t.l2StyleGap++;
    if (p.levels.L2.status === STATUS.COMPLETE) t.l2Complete++;
    else if (p.levels.L2.status === STATUS.PARTIAL) t.l2Partial++;
    else t.l2NotCovered++;
    if (!p.levels.L2.interaction.verified && p.levels.L2.interaction.applicableCount > 0) t.interactionUnverifiedRoutes++;
    if (p.levels.L3.status === STATUS.BLOCKED) t.l3Blocked++;
    else t.l3NotApplicable++;
    if (p.levels.L4.status === STATUS.BLOCKED) t.l4Blocked++;
    if (p.levels.L5.status === STATUS.BLOCKED) t.l5Blocked++;
    if (p.highestProvenLevel in t.highestLevel) t.highestLevel[p.highestProvenLevel]++;
    if (p.findings.length) {
      t.routesWithFindings++;
      t.openFindingsOnRoutes += p.findings.filter((f) => f.status === 'open').length;
    }
  }
  return t;
}

/**
 * Model invariant kapısı (§4.9). İhlal → fırlatır (fail-closed).
 * @param {ReturnType<typeof buildSurfaceModel>} model
 */
export function validateSurfaceInvariants(model) {
  const errors = [];
  const routeCount = model.inventory.registeredRoutes;

  // #1/#2: her rota tam bir kez; sayı envanterle eşit.
  if (model.pages.length !== routeCount) {
    errors.push(`pages.length (${model.pages.length}) ≠ kayıtlı rota (${routeCount}).`);
  }
  const seen = new Set();
  for (const p of model.pages) {
    if (seen.has(p.route)) errors.push(`Rota birden çok satırda: ${p.route}`);
    seen.add(p.route);
    const L = p.levels;

    // #3: runtime sonucu olmadan L1 PROVEN olamaz; PROVEN yalnız PASS/FLAKY.
    if (L.L1.status === STATUS.PROVEN && !(L.L1.runtimeStatus === 'PASS' || L.L1.runtimeStatus === 'FLAKY')) {
      errors.push(`[${p.route}] L1 PROVEN ama runtime PASS/FLAKY değil (${L.L1.runtimeStatus}).`);
    }

    // #4: bir zorunlu stil boyutu eksik VEYA bir geçerli etkileşim boyutu doğrulanmamışken L2 COMPLETE olamaz.
    if (L.L2.status === STATUS.COMPLETE) {
      if (!L.L2.style.contractMet) errors.push(`[${p.route}] L2 COMPLETE ama stil sözleşmesi karşılanmadı.`);
      for (const d of L.L2.interaction.applicableDimensions) {
        if (L.L2.interaction.dimensions[d].status !== STATUS.COVERED) {
          errors.push(`[${p.route}] L2 COMPLETE ama etkileşim boyutu doğrulanmamış: ${d}.`);
        }
      }
    }
    // Stil sayaç tutarlılığı.
    const covered = L.L2.style.requiredDimensions.filter(
      (d) => L.L2.style.dimensions[d].status === STATUS.COVERED ||
        (L.L2.style.dimensions[d].status === STATUS.NOT_APPLICABLE && L.L2.style.dimensions[d].reasonCode === REASON_CODES.DECLARED_NA)
    ).length;
    if (covered !== L.L2.style.coveredOrExempt) {
      errors.push(`[${p.route}] L2 stil coveredOrExempt (${L.L2.style.coveredOrExempt}) ≠ gerçek (${covered}).`);
    }
    // Etkileşim: COVERED YALNIZ makine-okur işaretle (IX_SIGNAL_PRESENT) mümkündür;
    // işaretsiz COVERED = sahte kanıt (WP-L2-WAVE-1 / ADR-0014). Ayrıca uygulanamaz/N-A
    // boyut için beyan edilmiş işaret (misdeclared) = yüzeyde olmayan bileşen iddiası → sahte kanıt.
    for (const [d, s] of Object.entries(L.L2.interaction.dimensions)) {
      if (s.status === STATUS.COVERED && s.reasonCode !== REASON_CODES.IX_SIGNAL_PRESENT) {
        errors.push(`[${p.route}] L2 etkileşim/${d} COVERED ama IX_SIGNAL_PRESENT değil (sahte kanıt).`);
      }
    }
    if ((L.L2.interaction.misdeclaredSignals || []).length > 0) {
      errors.push(`[${p.route}] L2 etkileşim işareti uygulanamaz/N-A boyut için beyan edilmiş (sahte kanıt): ${L.L2.interaction.misdeclaredSignals.join(', ')}`);
    }

    // #5/#6/#7: L3/L4/L5 asla COMPLETE/PROVEN.
    for (const lvl of ['L3', 'L4', 'L5']) {
      if (L[lvl].status === STATUS.COMPLETE || L[lvl].status === STATUS.PROVEN) {
        errors.push(`[${p.route}] ${lvl} altyapısız COMPLETE/PROVEN olamaz (${L[lvl].status}).`);
      }
    }

    // #8/#9: BLOCKED/NOT_RUN/NOT_APPLICABLE/UNVERIFIED reasonCode taşımalı; status/reasonCode geçerli olmalı.
    const checkNode = (label, s) => {
      if (!STATUS_VALUES.has(s.status)) errors.push(`[${p.route}] ${label} geçersiz status: ${s.status}`);
      const needsReason = [STATUS.BLOCKED, STATUS.NOT_RUN, STATUS.NOT_APPLICABLE, STATUS.UNVERIFIED].includes(s.status);
      if (needsReason && !s.reasonCode) errors.push(`[${p.route}] ${label} ${s.status} reasonCode taşımıyor (sessiz N/A yasak).`);
      if (s.reasonCode && !REASON_VALUES.has(s.reasonCode)) errors.push(`[${p.route}] ${label} geçersiz reasonCode: ${s.reasonCode}`);
    };
    checkNode('L1', L.L1);
    checkNode('L3', L.L3);
    checkNode('L4', L.L4);
    checkNode('L5', L.L5);
    for (const [d, s] of Object.entries(L.L2.style.dimensions)) checkNode(`L2.style/${d}`, s);
    for (const [d, s] of Object.entries(L.L2.interaction.dimensions)) checkNode(`L2.interaction/${d}`, s);
    if (!STATUS_VALUES.has(L.L2.status)) errors.push(`[${p.route}] L2 geçersiz status: ${L.L2.status}`);

    // highestProvenLevel geçerli + L1 ile tutarlı.
    if (!HIGHEST_LEVELS.includes(p.highestProvenLevel)) errors.push(`[${p.route}] geçersiz highestProvenLevel: ${p.highestProvenLevel}`);
    if (p.highestProvenLevel !== 'L0' && L.L1.status !== STATUS.PROVEN) {
      errors.push(`[${p.route}] highest ${p.highestProvenLevel} ama L1 PROVEN değil.`);
    }

    // #11: finding alanları güvenli/dolu.
    for (const f of p.findings) {
      if (!f.id || !f.severity || !f.status) errors.push(`[${p.route}] eksik finding alanı: ${JSON.stringify(f)}`);
    }
  }

  if (errors.length) {
    const err = new Error('Surface-depth model invariant ihlali:\n  - ' + errors.join('\n  - '));
    err.name = 'SurfaceModelInvariantError';
    throw err;
  }
  return true;
}

// ── Render: JSON (makine-okur, deterministik) ────────────────────────────────
export function renderSurfaceJson(model) {
  return JSON.stringify(model, null, 2) + '\n';
}

// ── Render: Markdown (repo source-of-truth, drift kapısına uygun) ─────────────
function mdCell(v) {
  return String(v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}
const L1_BADGE = {
  [STATUS.PROVEN]: '✅ PROVEN',
  [STATUS.FAIL]: '❌ FAIL',
  [STATUS.FLAKY]: '🟡 FLAKY',
  [STATUS.BLOCKED]: '⛔ BLOCKED',
  [STATUS.NOT_RUN]: '⚪ NOT_RUN',
};
const L2_BADGE = {
  [STATUS.COMPLETE]: '✅ COMPLETE',
  [STATUS.PARTIAL]: '🟡 PARTIAL',
  [STATUS.NOT_COVERED]: '❌ NOT_COVERED',
};
const HIGHEST_BADGE = {
  L0: '⚪ L0',
  L1: '① L1',
  L2_STYLE: '🟡 L2·style',
  L2_DEEP: '✅ L2·deep',
};

export function renderSurfaceMarkdown(model) {
  const t = model.totals;
  const L = [];
  L.push('# Vomenta — Rota Kapsam Derinliği Matrisi (L1–L5)');
  L.push('');
  L.push('> ⚙️ **Otomatik üretilir** — elle düzenlemeyin. Güncelle: `npm run report:surface`.');
  L.push('> Kaynak: `tests/contracts/registered-routes.js` (envanter) + `docs/raporlar/TEST-SONUCLARI.json` (L1 runtime) + Playwright etiketleri (L2 statik). Kurallar: HANDOFF §4 · ADR-0012.');
  L.push(`> **Kanıt:** commit \`${model.source.sourceCommit || '—'}\` · ortam \`${model.source.environment || '—'}\` · tarayıcı \`${model.source.browser || '—'}\` · runtime üretim \`${model.source.runtimeGeneratedAt || '—'}\``);
  L.push('');
  L.push('## Bu rapor neyi kanıtlar / ne kanıtlamaz');
  L.push('');
  L.push('- **L1 (PROVEN):** rotanın GERÇEK read-only runtime açılış sonucu (erişim/URL/temel yüzey). Runtime sonucu olmayan rota L1 PROVEN olamaz.');
  L.push('- **L2 iki katman:** (a) **Stil sözleşmesi** — a11y/i18n/layout/errorpath/keyboard/clean/deeplink/visual/perf/data/export için STATİK etiket kanıtı (`COVERED` = test VAR; bu koşumda çalıştı demek DEĞİL). (b) **Etkileşim derinliği** — sekme/filtre/tablo/pagination/boş/loading için, ilgili `@ix-*` makine-okur işaretini taşıyan bir dedicated etkileşim testi VARSA `COVERED`, yoksa dürüstçe `UNVERIFIED` (ADR-0014). Kanıt standardı stil ile AYNI: etiket = o boyut için gerçek test var.');
  L.push('- **`L2·style`** = açılış + stil sözleşmesi kapsandı, etkileşim derinliği kanıtsız. **`L2·deep`** = ayrıca tüm geçerli etkileşim boyutu `@ix-*` işaretli testle kanıtlı (yüzeyde bulunmayan boyut açık gerekçeyle N/A — `naInteraction`).');
  L.push('- **L3/L4/L5:** production read-only + rol/tenant/provider altyapısı olmadan KANITLANAMAZ → tasarım gereği `BLOCKED`/`NOT_APPLICABLE`. Eksik değil, dürüst sınır beyanı.');
  L.push('');
  L.push('## Özet (türetilmiş — sabit sayı yok)');
  L.push('');
  L.push(`- **Kayıtlı rota:** ${t.registeredRoutes} · sözleşme sayfası: ${model.inventory.testedPagesContracts}`);
  L.push(`- **L1:** PROVEN ${t.l1Proven} · not-proven ${t.l1NotProven}`);
  L.push(`- **L2 stil sözleşmesi:** karşılandı ${t.l2StyleContractMet} · gerçek boşluk ${t.l2StyleGap}`);
  L.push(`- **L2 durum:** COMPLETE ${t.l2Complete} · PARTIAL ${t.l2Partial} · NOT_COVERED ${t.l2NotCovered}`);
  L.push(`- **Etkileşim derinliği tam doğrulanmayan rota:** ${t.interactionUnverifiedRoutes} — en az bir geçerli boyut hâlâ \`@ix-*\` işaretsiz (WP-L2-WAVE-1 dalgalarının hedefi). İşaretli boyutlar "etkileşim (doğrulanan/geçerli)" sütununda sayılır.`);
  L.push(`- **L3:** BLOCKED(staging) ${t.l3Blocked} · N/A(no-write) ${t.l3NotApplicable}`);
  L.push(`- **L4:** BLOCKED(rol/tenant) ${t.l4Blocked} · **L5:** BLOCKED(provider) ${t.l5Blocked}`);
  L.push(`- **En yüksek seviye dağılımı:** L0 ${t.highestLevel.L0} · L1 ${t.highestLevel.L1} · L2·style ${t.highestLevel.L2_STYLE} · L2·deep ${t.highestLevel.L2_DEEP}`);
  L.push(`- **Bilinen bulgu:** ${model.inventory.knownBugs.total} (open ${model.inventory.knownBugs.open} · fixed-candidate ${model.inventory.knownBugs.fixedCandidate} · closed ${model.inventory.knownBugs.closed}) · rotaya bağlı open bulgu: ${t.openFindingsOnRoutes} (${t.routesWithFindings} rota)`);
  L.push(`- **Rotaya eşlenmeyen test sonucu (unmappedTests):** ${model.unmappedTests.length} — hiçbir rotayı yeşile boyamaz. **Rotaya bağlanamayan bulgu:** ${model.unmappedFindings.length}`);
  L.push('');

  L.push('## Kapsam derinliği — tüm kayıtlı rotalar');
  L.push('');
  L.push('| rota | sözleşme | en yüksek | L1 | L2 | stil (kapsanan/zorunlu) | etkileşim (doğrulanan/geçerli) | L3 | L4 | L5 | bulgular |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const p of model.pages) {
    const l1 = L1_BADGE[p.levels.L1.status] || mdCell(p.levels.L1.status);
    const l2 = L2_BADGE[p.levels.L2.status] || mdCell(p.levels.L2.status);
    const st = `${p.levels.L2.style.coveredOrExempt}/${p.levels.L2.style.requiredCount}`;
    const ix = `${p.levels.L2.interaction.coveredCount}/${p.levels.L2.interaction.applicableCount}`;
    const l3 = p.levels.L3.status === STATUS.BLOCKED ? '⛔ staging' : 'N/A';
    const bugs = mdCell(p.findings.map((b) => `${b.id}(${b.severity}/${b.status})`).join(' '));
    L.push(`| \`${mdCell(p.route)}\` | ${mdCell(p.contracts.join(','))} | ${HIGHEST_BADGE[p.highestProvenLevel]} | ${l1} | ${l2} | ${st} | ${ix} | ${l3} | ⛔ rol | ⛔ provider | ${bugs} |`);
  }
  L.push('');

  L.push('## L2 stil boyutu detayı (statik etiket kapsamı)');
  L.push('');
  L.push('Hücreler: ✅ COVERED (test var) · ❌ NOT_COVERED (zorunlu, eksik) · N/A gerekçeli · — zorunlu değil.');
  L.push('');
  L.push('| rota | ' + STYLE_DIMENSIONS.map((d) => `@${d}`).join(' | ') + ' |');
  L.push('|---|' + STYLE_DIMENSIONS.map(() => '---').join('|') + '|');
  for (const p of model.pages) {
    const cells = STYLE_DIMENSIONS.map((d) => {
      const s = p.levels.L2.style.dimensions[d];
      if (s.status === STATUS.COVERED) return '✅';
      if (s.status === STATUS.NOT_COVERED) return '❌';
      if (s.status === STATUS.NOT_APPLICABLE && s.reasonCode === REASON_CODES.DECLARED_NA) return 'N/A';
      return '—';
    });
    L.push(`| \`${mdCell(p.route)}\` | ` + cells.join(' | ') + ' |');
  }
  L.push('');

  L.push('## L2 etkileşim boyutu detayı (makine-okur işaret kapsamı)');
  L.push('');
  L.push('Hücreler: ✅ COVERED (ilgili `@ix-*` işaretli dedicated etkileşim testi var) · 🔎 UNVERIFIED (bileşen geçerli ama işaret yok) · N/A gerekçeli (`naInteraction` — yüzeyde bulunmuyor) · — geçerli değil (arketip beyan etmiyor).');
  L.push('');
  L.push('| rota | ' + INTERACTION_DIMENSIONS.map((d) => d).join(' | ') + ' |');
  L.push('|---|' + INTERACTION_DIMENSIONS.map(() => '---').join('|') + '|');
  for (const p of model.pages) {
    const cells = INTERACTION_DIMENSIONS.map((d) => {
      const s = p.levels.L2.interaction.dimensions[d];
      if (s.status === STATUS.COVERED) return '✅';
      if (s.status === STATUS.UNVERIFIED) return '🔎';
      if (s.status === STATUS.NOT_APPLICABLE && s.reasonCode === REASON_CODES.DECLARED_NA) return 'N/A';
      return '—';
    });
    L.push(`| \`${mdCell(p.route)}\` | ` + cells.join(' | ') + ' |');
  }
  L.push('');

  L.push('## Staging/rol/provider nedeniyle bloklu seviyeler');
  L.push('');
  L.push(`- **L3 (mutation/CRUD):** ${t.l3Blocked} rota yazma yüzeyine sahip → \`STAGING_REQUIRED\` (production read-only'de kanıtlanamaz). ${t.l3NotApplicable} rota yazma yüzeyi yok → \`NO_WRITE_SURFACE\`.`);
  L.push(`- **L4 (rol/permission/tenant):** ${t.l4Blocked} rota → \`ROLE_ACCOUNTS_REQUIRED\` (rol/tenant hesap altyapısı yok).`);
  L.push(`- **L5 (uçtan-uca provider):** ${t.l5Blocked} rota → \`PROVIDER_HARNESS_REQUIRED\` (SMS/çağrı/e-posta/WhatsApp test koşum-takımı yok).`);
  L.push('');
  return L.join('\n');
}
