// @ts-check
/**
 * WP-SURFACE-GATE (FAZ 2) — SURFACE COMPLETENESS MOTORU (saf kütüphane / ADR-0019).
 *
 * AMAÇ: Repo içindeki HİÇBİR rota kaynağının kanonik `PRODUCT_SURFACES` registry'si
 * DIŞINDA sessizce kalamamasını sağlamak. Navigasyon, kapsam sözleşmeleri, spec route
 * marker'ları, known bug'lar, runtime raporu, discovery raporu ve PR-impact yüzey
 * eşlemesi gibi GÖZLEM kaynaklarındaki her rota registry ile UZLAŞTIRILIR:
 *   - kayıtsız rota           → UNREGISTERED_OBSERVED (gate exit 1)
 *   - dinamik yanlış template → DYNAMIC_TEMPLATE_MISMATCH (gate exit 1)
 *   - belirsiz (>1) eşleşme   → AMBIGUOUS_SURFACE_MATCH (gate exit 1)
 *   - kaynaksız registry      → UNREFERENCED_REGISTERED (runtimePolicy'ye göre karar)
 *
 * SAFLIK: Bu dosya YALNIZ saf fonksiyon içerir (dosya sistemi / CLI / prod yan etkisi
 * YOK). Böylece `self-check-surface-completeness.mjs` hem GERÇEK repo ağacını hem de
 * TAMAMEN SENTETİK negatif fixture'ları production'a bağlanmadan doğrular.
 *
 * NORMALİZASYON: yalnız GÜVENLİ ve KAYIPSIZ dönüşüm — kök dışı tek sondaki '/'
 * kaldırılır. Query/fragment/origin ASLA soyulmaz; kaldıkları için eşleşmezler ve
 * fail-closed biçimde UNREGISTERED_OBSERVED olurlar (registry rotaları bunları içermez).
 *
 * DÜRÜSTLÜK: `main-navigation` (routeLevelBaseline) kaydı DEDICATED kapsam SAYILMAZ —
 * yalnız açılış tabanı kanıtıdır. Sıfır envanter veya sıfır gözlemle sahte-yeşil REDDEDİLİR.
 */
import { validateRegistry } from '../tests/contracts/product-surfaces.js';

export const SCHEMA_VERSION = 1;

/** Registry ile uzlaştırılan gözlem kaynağı tipleri (≥6 zorunlu — HANDOFF FAZ 2 §Kabul). */
export const SOURCE_KINDS = Object.freeze([
  'navigation',          // MAIN_NAVIGATION path'leri
  'coverage-contract',   // TESTED_PAGES dedicated (routeLevelBaseline OLMAYAN) rotaları
  'coverage-baseline',   // TESTED_PAGES routeLevelBaseline (main-navigation) rotaları
  'route-marker',        // spec `[route:/...]` marker evreni (REGISTERED_ROUTE_PATHS)
  'known-bug',           // KNOWN_BUGS[].route
  'runtime',             // runtime raporu pages[].route + unmappedTests routeMarker
  'discovery',           // discovery raporu gözlenen normalize rotalar
  'pr-impact',           // PR-impact yüzey eşlemesi (specFile → routes) union'ı
]);
const SOURCE_KIND_SET = new Set(SOURCE_KINDS);

/** Uzlaştırma reason code'ları (bilinmeyen kod fail-closed). */
export const RECONCILE_REASONS = Object.freeze({
  UNREGISTERED_OBSERVED: 'UNREGISTERED_OBSERVED',       // rota hiçbir yüzeye eşleşmiyor
  DYNAMIC_TEMPLATE_MISMATCH: 'DYNAMIC_TEMPLATE_MISMATCH', // dinamik görünüm ama hiçbir template'e uymuyor
  AMBIGUOUS_SURFACE_MATCH: 'AMBIGUOUS_SURFACE_MATCH',   // >1 yüzeye belirsiz eşleşme
  UNREFERENCED_REGISTERED: 'UNREFERENCED_REGISTERED',   // registry'de var, hiçbir kaynak referanslamıyor
});

/** runtimePolicy'ye göre "referanssız registry" toleransı. */
const REFERENCE_REQUIRED_POLICIES = new Set(['readonly-baseline']); // bunlar bir kaynakta görünmeli
const REFERENCE_OPTIONAL_POLICIES = new Set(['fixture-required', 'readonly-blocked', 'staging-only']);

/**
 * Bir rotayı GÜVENLİ/KAYIPSIZ biçimde normalize eder. Yalnız kök dışı tek sondaki '/'
 * kaldırılır. Boş/dizge-değil reddedilir. Query/fragment/origin KORUNUR (eşleşmezler →
 * fail-closed). @param {unknown} raw @returns {string}
 */
export function normalizeRoute(raw) {
  if (typeof raw !== 'string') throw new Error(`Rota dizge değil: ${JSON.stringify(raw)}`);
  let r = raw.trim();
  if (r === '') throw new Error('Rota boş olamaz.');
  if (r.length > 1 && r.endsWith('/')) r = r.slice(0, -1);
  return r;
}

/** Bir segment dinamik "template parametresi" mi (':param'). */
const isParamSeg = (seg) => seg.startsWith(':') && seg.length > 1;
/** Bir segment somut bir dinamik-INSTANCE değeri mi görünüyor ('{id}', ':id', sayı, uuid). */
function looksInstanceSeg(seg) {
  if (/^\{.+\}$/.test(seg)) return true;      // /x/{id}
  if (/^:.+/.test(seg)) return true;          // /x/:id
  if (/^\d+$/.test(seg)) return true;         // /x/1234
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F-]{20,}$/.test(seg)) return true; // uuid
  return false;
}
/** Rota, tanımlı statik hiçbir yüzeye uymayıp dinamik-instance kokusu taşıyor mu. */
function routeLooksDynamic(route) {
  return route.split('/').some((s) => s && looksInstanceSeg(s));
}

/**
 * Bir dinamik template (`/a/:id`) verilen gözlem segmentlerine uyuyor mu. Aynı segment
 * sayısı; param olmayan segmentler birebir eşit; param segmenti herhangi bir BOŞ OLMAYAN
 * somut/placeholder değeri kabul eder (kayıpsız — uydurma normalize yok).
 * @param {string} template @param {string[]} segs
 */
function templateMatches(template, segs) {
  const ts = template.split('/');
  if (ts.length !== segs.length) return false;
  for (let i = 0; i < ts.length; i++) {
    if (isParamSeg(ts[i])) {
      if (!segs[i]) return false; // param boş olamaz
    } else if (ts[i] !== segs[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Tek bir gözlem rotasını registry ile eşler (SAF). Eşleşme sırası: (1) birebir statik/
 * redirect/dynamic-template literal; (2) dinamik template. >1 aday = belirsiz.
 * @param {unknown} rawRoute
 * @param {ReadonlyArray<any>} surfaces
 * @returns {{route:string, matched:boolean, surfaceId:string|null, kind:('exact'|'dynamic'|null), candidates?:string[], reason?:string}}
 */
export function matchSurface(rawRoute, surfaces) {
  const route = normalizeRoute(rawRoute);

  // (1) birebir rota eşleşmesi (statik + redirect + dynamic template'in literal hâli)
  const exact = surfaces.filter((s) => s && s.route === route);
  if (exact.length === 1) return { route, matched: true, surfaceId: exact[0].id, kind: 'exact' };
  if (exact.length > 1) {
    return { route, matched: false, surfaceId: null, kind: null, candidates: exact.map((s) => s.id).sort(), reason: RECONCILE_REASONS.AMBIGUOUS_SURFACE_MATCH };
  }

  // (2) dinamik template eşleşmesi (instance → tanımlı :param şablonu)
  const segs = route.split('/');
  const dyn = surfaces.filter((s) => s && s.routeKind === 'dynamic' && templateMatches(s.route, segs));
  if (dyn.length === 1) return { route, matched: true, surfaceId: dyn[0].id, kind: 'dynamic' };
  if (dyn.length > 1) {
    return { route, matched: false, surfaceId: null, kind: null, candidates: dyn.map((s) => s.id).sort(), reason: RECONCILE_REASONS.AMBIGUOUS_SURFACE_MATCH };
  }

  // eşleşme yok — dinamik-instance kokusu varsa "template uyumsuz", değilse düz kayıtsız
  const reason = routeLooksDynamic(route)
    ? RECONCILE_REASONS.DYNAMIC_TEMPLATE_MISMATCH
    : RECONCILE_REASONS.UNREGISTERED_OBSERVED;
  return { route, matched: false, surfaceId: null, kind: null, reason };
}

/**
 * Bir kaynağı normalize eder → { kind, routes:[{route,label}] }.
 * `routes` girişleri dizge veya {route,label} olabilir.
 * @param {{kind:string, routes:ReadonlyArray<string|{route:string,label?:string}>}} src
 */
function normalizeSource(src) {
  if (!src || !SOURCE_KIND_SET.has(src.kind)) {
    throw new Error(`Bilinmeyen kaynak tipi: ${src && src.kind}`);
  }
  const routes = (src.routes || []).map((r) => (typeof r === 'string' ? { route: r, label: null } : { route: r.route, label: r.label ?? null }));
  return { kind: src.kind, routes };
}

/**
 * TÜM gözlem kaynaklarını registry ile uzlaştırır (SAF). Fırlatmaz; denetlenebilir bir
 * model döndürür. Kapı kararı `validateCompleteness` ile ayrı verilir.
 *
 * @param {object} opts
 * @param {ReadonlyArray<any>} opts.surfaces  PRODUCT_SURFACES
 * @param {ReadonlyArray<{kind:string, routes:ReadonlyArray<string|{route:string,label?:string}>}>} opts.sources
 * @param {string} [opts.generatedAt]
 */
export function reconcile(opts) {
  const surfaces = opts.surfaces || [];
  const sources = (opts.sources || []).map(normalizeSource);

  /** @type {{kind:string, route:string, label:string|null, reason:string}[]} */
  const unregisteredObserved = [];
  /** @type {{kind:string, route:string, label:string|null, candidates:string[]}[]} */
  const ambiguous = [];
  /** @type {Map<string, Set<string>>} surfaceId → kaynak tipleri */
  const referencedBy = new Map();
  const perSource = {};
  let totalObservations = 0;
  const distinctObserved = new Set();

  for (const src of sources) {
    const stat = { total: 0, matched: 0, unregistered: 0, ambiguous: 0 };
    for (const { route, label } of src.routes) {
      let m;
      try {
        m = matchSurface(route, surfaces);
      } catch (e) {
        // normalize hatası (boş/dizge değil) → kayıtsız muamelesi (fail-closed)
        unregisteredObserved.push({ kind: src.kind, route: String(route), label: label ?? null, reason: RECONCILE_REASONS.UNREGISTERED_OBSERVED });
        stat.total++; stat.unregistered++;
        continue;
      }
      stat.total++;
      totalObservations++;
      distinctObserved.add(`${src.kind}::${m.route}`);
      if (m.matched && m.surfaceId) {
        stat.matched++;
        if (!referencedBy.has(m.surfaceId)) referencedBy.set(m.surfaceId, new Set());
        referencedBy.get(m.surfaceId).add(src.kind);
      } else if (m.reason === RECONCILE_REASONS.AMBIGUOUS_SURFACE_MATCH) {
        stat.ambiguous++;
        ambiguous.push({ kind: src.kind, route: m.route, label: label ?? null, candidates: m.candidates || [] });
      } else {
        stat.unregistered++;
        unregisteredObserved.push({ kind: src.kind, route: m.route, label: label ?? null, reason: m.reason || RECONCILE_REASONS.UNREGISTERED_OBSERVED });
      }
    }
    perSource[src.kind] = stat;
  }

  // referanssız registry yüzeyleri (runtimePolicy'ye göre zorunlu/opsiyonel ayrımı)
  const unreferencedRegistered = [];
  for (const s of surfaces) {
    if (!s || typeof s.id !== 'string') continue;
    if (referencedBy.has(s.id)) continue;
    const policy = String(s.runtimePolicy);
    const required = REFERENCE_REQUIRED_POLICIES.has(policy);
    unreferencedRegistered.push({ surfaceId: s.id, route: s.route, runtimePolicy: policy, referenceRequired: required });
  }

  const model = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: opts.generatedAt || null,
    inventory: {
      surfaces: surfaces.length,
      sources: sources.length,
      sourceKinds: sources.map((s) => s.kind),
    },
    totals: {
      observations: totalObservations,
      distinctObservations: distinctObserved.size,
      referencedSurfaces: referencedBy.size,
      unregisteredObserved: unregisteredObserved.length,
      ambiguous: ambiguous.length,
      unreferencedRegistered: unreferencedRegistered.length,
      unreferencedRequired: unreferencedRegistered.filter((u) => u.referenceRequired).length,
    },
    perSource,
    unregisteredObserved: unregisteredObserved.slice().sort(byKindRoute),
    ambiguous: ambiguous.slice().sort(byKindRoute),
    unreferencedRegistered: unreferencedRegistered.slice().sort((a, b) => a.surfaceId.localeCompare(b.surfaceId)),
    referencedBy: Object.fromEntries([...referencedBy.entries()].map(([k, v]) => [k, [...v].sort()]).sort((a, b) => a[0].localeCompare(b[0]))),
  };
  return model;
}

function byKindRoute(a, b) {
  return a.kind === b.kind ? a.route.localeCompare(b.route) : a.kind.localeCompare(b.kind);
}

/**
 * SERT KAPI kararı (SAF). Uzlaştırma modelini + registry sağlığını değerlendirir; ihlal
 * dizesi listesi döndürür (boş = geçti). Her ihlal ROTA + KAYNAK + DÜZELTME yolu taşır.
 *
 * Fail-closed kuralları (HANDOFF FAZ 2 §Zorunlu negatif kanıtlar):
 *   - boş registry / boş kaynak seti / sıfır gözlem → sahte-yeşil REDDEDİLİR.
 *   - herhangi bir UNREGISTERED_OBSERVED / DYNAMIC_TEMPLATE_MISMATCH → exit 1.
 *   - herhangi bir AMBIGUOUS_SURFACE_MATCH → exit 1.
 *   - runtimePolicy=readonly-baseline yüzeyi HİÇBİR kaynak referanslamıyorsa → exit 1
 *     (opsiyonel-policy'ler fixture/blocked/staging referanssız kalabilir; kabul edilir).
 *
 * @param {ReturnType<typeof reconcile>} model
 * @param {ReadonlyArray<any>} surfaces  registry sağlığı için ham liste
 * @returns {string[]}
 */
export function validateCompleteness(model, surfaces) {
  const errors = [];

  // 0) Registry'nin kendisi geçerli olmalı (Faz 1 validator'ı burada da fail-closed).
  const regErrs = validateRegistry(surfaces || []);
  if (regErrs.length) {
    errors.push(`Kanonik registry geçersiz (${regErrs.length}) — completeness güvenilir değil.`);
    for (const e of regErrs) errors.push(`  · ${e}`);
  }

  // 1) Sahte-yeşil savunması: boş envanter / kaynak / sıfır gözlem.
  if (!surfaces || surfaces.length === 0) {
    errors.push('Boş kanonik envanter ile completeness kanıtlanamaz (sahte-yeşil reddedilir).');
  }
  if (model.inventory.sources === 0) {
    errors.push('Hiç gözlem kaynağı verilmedi — completeness kanıtlanamaz (sahte-yeşil reddedilir).');
  }
  if (model.totals.observations === 0) {
    errors.push('Sıfır gözlenen rota — completeness kanıtlanamaz (sahte-yeşil reddedilir).');
  }
  // ≥6 kaynak zorunluluğu (HANDOFF FAZ 2 §Kabul: "en az altı farklı kaynak").
  if (model.inventory.sources > 0 && model.inventory.sources < 6) {
    errors.push(`En az 6 gözlem kaynağı uzlaştırılmalı; yalnız ${model.inventory.sources} verildi.`);
  }

  // 2) Kayıtsız gözlem → her biri ayrı, düzeltme yollu.
  for (const u of model.unregisteredObserved) {
    if (u.reason === RECONCILE_REASONS.DYNAMIC_TEMPLATE_MISMATCH) {
      errors.push(`[${u.kind}] '${u.route}' dinamik-instance ama hiçbir :param template'ine uymuyor → PRODUCT_SURFACES'e dynamic yüzey ekleyin ya da kaynağı düzeltin.`);
    } else {
      errors.push(`[${u.kind}] '${u.route}' kanonik registry'de YOK (UNREGISTERED_OBSERVED) → tests/contracts/product-surfaces.js'e ekleyin ya da kaynağı düzeltin.`);
    }
  }

  // 3) Belirsiz eşleşme → tek bir yüzeye netleştirilmeli.
  for (const a of model.ambiguous) {
    errors.push(`[${a.kind}] '${a.route}' birden çok yüzeye belirsiz eşleşiyor (${a.candidates.join(', ')}) → çakışan template'leri netleştirin.`);
  }

  // 4) Zorunlu-referanslı registry yüzeyi hiçbir kaynakta görünmüyor.
  for (const u of model.unreferencedRegistered) {
    if (u.referenceRequired) {
      errors.push(`Registry yüzeyi '${u.surfaceId}' (${u.route}, ${u.runtimePolicy}) HİÇBİR kaynakta referanslanmıyor (UNREFERENCED_REGISTERED) → bir gözlem kaynağıyla bağlayın ya da policy'yi gözden geçirin.`);
    }
  }

  return errors;
}

/**
 * TESTED_PAGES kapsam sözleşmelerini DEDICATED vs BASELINE olarak ayırır (SAF).
 * `main-navigation` (routeLevelBaseline) rotaları dedicated kapsam SAYILMAZ (§Kabul).
 * @param {ReadonlyArray<any>} testedPages
 * @returns {{ dedicated: string[], baseline: string[] }}
 */
export function classifyCoverageContracts(testedPages) {
  const dedicated = new Set();
  const baseline = new Set();
  for (const p of testedPages || []) {
    const target = p && p.routeLevelBaseline ? baseline : dedicated;
    for (const r of (p && p.routes) || []) target.add(normalizeRoute(r));
  }
  return { dedicated: [...dedicated].sort(), baseline: [...baseline].sort() };
}

/**
 * Bir rotanın DEDICATED (yalnız main-navigation değil) kapsam sözleşmesi var mı (SAF).
 * Negatif kanıt: yalnız routeLevelBaseline sözleşmesiyle "dedicated" iddiası → false.
 * @param {string} route @param {ReadonlyArray<any>} testedPages
 */
export function isDedicatedlyCovered(route, testedPages) {
  const norm = normalizeRoute(route);
  return classifyCoverageContracts(testedPages).dedicated.includes(norm);
}

/**
 * PR-impact YÜZEY EŞLEMESİ (SAF): değişen bir spec dosyası hangi ürün rotalarını etkiler.
 * TESTED_PAGES'ten `specFile → routes` haritası türetir. Bu harita PR-impact motorunun
 * "değişen dosya → etkilenen yüzey" görünümüdür; union'ı completeness'in 'pr-impact'
 * kaynağıdır (kayıtsız etkilenen rota da kapıyı kırar).
 * @param {ReadonlyArray<any>} testedPages
 * @returns {{ map: Record<string,string[]>, routes: string[] }}
 */
export function buildPrImpactSurfaceMap(testedPages) {
  /** @type {Record<string,Set<string>>} */
  const map = {};
  const all = new Set();
  for (const p of testedPages || []) {
    const routes = ((p && p.routes) || []).map((r) => normalizeRoute(r));
    for (const spec of (p && p.specFiles) || []) {
      const key = String(spec).split('/').pop();
      if (!map[key]) map[key] = new Set();
      for (const r of routes) { map[key].add(r); all.add(r); }
    }
  }
  return {
    map: Object.fromEntries(Object.entries(map).map(([k, v]) => [k, [...v].sort()]).sort((a, b) => a[0].localeCompare(b[0]))),
    routes: [...all].sort(),
  };
}

/** Deterministik JSON render (rapor/inceleme için). */
export function renderCompletenessJson(model) {
  return JSON.stringify(model, null, 2) + '\n';
}
