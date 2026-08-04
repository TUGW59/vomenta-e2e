// @ts-check
import { PRODUCT_SURFACES, SURFACE_BY_ID } from './product-surfaces.js';
import { MAIN_NAVIGATION } from './navigation.js';

/**
 * KAYITLI ROTA ENVANTERİ (tek gerçeklik kaynağı) — FAZ 3 / WP-SURFACE-MIGRATION.
 *
 * Bu envanter artık `tested-pages.js` (TEST KAPSAMI İDDİASI) yerine kanonik
 * `PRODUCT_SURFACES` (ÜRÜN VARLIĞI) registry'sinden türetilir. Böylece "üründe var
 * olan yüzey" bilgisi "test kapsamı iddiası"na BAĞIMLI DEĞİLDİR: kapsam sözleşmesi
 * OLMAYAN bir ürün yüzeyi envanterden SESSİZCE kaybolmaz; baseline envanterine girer
 * ve raporda `NO_COVERAGE_CONTRACT` olarak dürüstçe görünür (HANDOFF FAZ 3 §Kritik koruma).
 *
 * NEDEN ÖNEMLİ: Eski yapı döngüseldi (TESTED_PAGES → REGISTERED_ROUTES → baseline test →
 * style/surface matrisi). Bir sayfa TESTED_PAGES'e eklenmemişse üç matristen aynı anda
 * kayboluyordu. Bu dosya o döngüyü kırar: rota evreni kanonik registry'dir.
 *
 * RUNTIME BASELINE POLİTİKASI (fail-closed; sahte PASS üretmez):
 *   - `readonly-baseline`  → RUNNABLE: salt-okunur açılış tabanı testi üretilir.
 *   - `readonly-blocked`   → BLOCKED : reason code'lu; koşulmaz (test.fixme), yeşile boyanmaz.
 *   - `fixture-required`   → BLOCKED : güvenli gerçek ID yok; koşulmaz (test.fixme).
 *   - `staging-only`       → BLOCKED : yalnız staging; production'da koşulmaz.
 *   - routeKind `redirect` → REDIRECT: kaynak + hedef doğrulanır (sessiz PASS değil).
 *
 * Başlık (`heading`) registry'de TUTULMAZ; MAIN_NAVIGATION'dan (canlı gözlem) yeniden
 * kullanılır. Derin rotalarda başlık BİLİNMİYORSA `null`'dır ve spec başlık UYDURMAZ.
 */

/** MAIN_NAVIGATION başlık metadata'sı: path → beklenen sayfa başlığı. */
const HEADING_BY_PATH = new Map(MAIN_NAVIGATION.map(({ path, heading }) => [path, heading]));

/** Baseline üretim türleri (runtime-policy'den türetilir). */
export const BASELINE_KINDS = Object.freeze({
  RUNNABLE: 'runnable', // readonly-baseline: gerçek açılış tabanı testi
  BLOCKED: 'blocked',   // fixture-required / readonly-blocked / staging-only: koşulmaz
  REDIRECT: 'redirect', // routeKind=redirect: kaynak+hedef doğrulanır
});

/**
 * Bir yüzeyin runtime-policy + routeKind'ından baseline üretim türünü türetir (fail-closed).
 * @param {{ routeKind:string, runtimePolicy:string }} surface
 * @returns {'runnable'|'blocked'|'redirect'}
 */
export function baselineKindForSurface(surface) {
  if (surface.routeKind === 'redirect') return BASELINE_KINDS.REDIRECT;
  if (surface.runtimePolicy === 'readonly-baseline') return BASELINE_KINDS.RUNNABLE;
  // fixture-required | readonly-blocked | staging-only → koşulmaz
  return BASELINE_KINDS.BLOCKED;
}

/**
 * Bir rota sözleşmesini doğrular; geçersizse fırlatır (fail-closed).
 * Kabul edilen: production-içi, '/' ile başlayan, query/fragment/origin İÇERMEYEN pathname.
 * Dinamik `:param` segmentine İZİN VERİLİR (registry dynamic yüzey rotaları için).
 * Reddedilen: boş, mutlak URL, göreli, query-only, fragment-only, boşluk içeren.
 * @param {unknown} route
 * @returns {string}
 */
export function assertValidRoutePath(route) {
  if (typeof route !== 'string' || route.trim() === '') {
    throw new Error(`Geçersiz rota (boş/dizge değil): ${JSON.stringify(route)}`);
  }
  if (route.includes('://')) throw new Error(`Rota mutlak URL olamaz: ${route}`);
  if (!route.startsWith('/')) throw new Error(`Rota '/' ile başlamalı: ${route}`);
  if (/\s/.test(route)) throw new Error(`Rota boşluk içeremez: ${JSON.stringify(route)}`);
  if (route.includes('?')) throw new Error(`Rota query içeremez: ${route}`);
  if (route.includes('#')) throw new Error(`Rota fragment içeremez: ${route}`);
  return route;
}

/**
 * Kanonik yüzeylerden deterministik + tekilleştirilmiş rota envanteri üretir. Registry
 * KAYIT SIRASINI korur (stabil). Her yüzey rota + runtime-policy'den türetilen baseline
 * türünü ve reason/redirect metadata'sını taşır. Registry zaten rota-tekilliğini
 * (validateRegistry) garanti eder; yine de savunmacı dedupe uygulanır.
 * @param {ReadonlyArray<any>} surfaces  PRODUCT_SURFACES
 * @returns {ReadonlyArray<{ path:string, heading:string|null, surfaceId:string, area:string, routeKind:string, lifecycle:string, runtimePolicy:string, baseline:string, blockedReason:(string|null), redirectTarget:(string|null), condition:(string|null) }>}
 */
export function buildRegisteredRoutes(surfaces) {
  const seen = new Set();
  const out = [];
  for (const s of surfaces || []) {
    const route = s.route;
    assertValidRoutePath(route);
    if (seen.has(route)) continue;
    seen.add(route);
    out.push(Object.freeze({
      path: route,
      heading: HEADING_BY_PATH.get(route) ?? null,
      surfaceId: s.id,
      area: s.area,
      routeKind: s.routeKind,
      lifecycle: s.lifecycle,
      runtimePolicy: s.runtimePolicy,
      baseline: baselineKindForSurface(s),
      blockedReason: s.blockedReason ?? null,
      redirectTarget: s.redirectTarget ?? null,
      condition: s.condition ?? null,
    }));
  }
  if (out.length === 0) throw new Error('Kayıtlı rota envanteri boş olamaz.');
  return Object.freeze(out);
}

/** Kanonik, tekilleştirilmiş kayıtlı rota envanteri (kanonik registry'den türetilir). */
export const REGISTERED_ROUTES = buildRegisteredRoutes(PRODUCT_SURFACES);

/** Yalnız path dizgeleri (araç/karşılaştırma kolaylığı için). */
export const REGISTERED_ROUTE_PATHS = Object.freeze(REGISTERED_ROUTES.map((r) => r.path));

/** Baseline türüne göre alt kümeler (route-baseline üretimi + self-check için). */
export const RUNNABLE_ROUTES = Object.freeze(REGISTERED_ROUTES.filter((r) => r.baseline === BASELINE_KINDS.RUNNABLE));
export const BLOCKED_ROUTES = Object.freeze(REGISTERED_ROUTES.filter((r) => r.baseline === BASELINE_KINDS.BLOCKED));
export const REDIRECT_ROUTES = Object.freeze(REGISTERED_ROUTES.filter((r) => r.baseline === BASELINE_KINDS.REDIRECT));

/** surfaceId → yüzey (kanonik registry) — tüketicilere kolaylık (re-export). */
export { SURFACE_BY_ID };

/**
 * Makine-okur rota işareti çözümleyici. Bir test/suite başlığındaki `[route:/x/y]`
 * işaretini yakalar (yoksa `null`). style-coverage.mjs ile aynı desen.
 */
export const ROUTE_MARKER_RE = /\[route:([^\]]+)\]/;

/**
 * @param {string} text
 * @returns {string|null}
 */
export function parseRouteMarker(text) {
  const m = String(text ?? '').match(ROUTE_MARKER_RE);
  return m ? m[1] : null;
}

/**
 * RUNNABLE (readonly-baseline) rota için kanonik read-only baseline test başlığı.
 * `[route:...]` işareti + `@smoke @route-baseline` etiketleri taşır. Spec ve self-check
 * AYNI üretici üzerinden çalışır → işaret/etiket sapması olamaz.
 * @param {string} path
 * @returns {string}
 */
export function routeBaselineTitle(path) {
  return `[route:${path}] kayıtlı rota read-only baseline @smoke @route-baseline`;
}

/**
 * BLOCKED (fixture-required / readonly-blocked / staging-only) rota için başlık.
 * `@route-blocked` etiketi taşır; spec bunu `test.fixme` ile ÜRETİR (asla PASS olmaz).
 * reason code başlıkta görünür → matris/rapor dürüstçe "neden koşulamadı"yı gösterir.
 * @param {string} path @param {string} reason
 * @returns {string}
 */
export function routeBlockedTitle(path, reason) {
  return `[route:${path}] kayıtlı rota blocked (${reason}) @route-blocked`;
}

/**
 * REDIRECT rota için başlık. `@smoke @route-redirect` etiketleri taşır; spec kaynak→hedef
 * yönlendirmesini doğrular (sessiz kök '/' PASS değil).
 * @param {string} path @param {string} target
 * @returns {string}
 */
export function routeRedirectTitle(path, target) {
  return `[route:${path}] kayıtlı rota redirect → ${target} @smoke @route-redirect`;
}
