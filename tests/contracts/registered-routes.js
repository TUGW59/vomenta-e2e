// @ts-check
import { TESTED_PAGES } from './tested-pages.js';
import { MAIN_NAVIGATION } from './navigation.js';

/**
 * KAYITLI ROTA ENVANTERİ (tek gerçeklik kaynağı).
 *
 * `tests/contracts/tested-pages.js` içindeki her sözleşmenin `routes` alanlarından
 * DETERMİNİSTİK ve TEKİLLEŞTİRİLMİŞ bir rota listesi türetir. Bu envanter,
 * `tests/registered-routes-smoke.authed.spec.js` tarafından "her kayıtlı rota için
 * tam bir read-only açılış tabanı" üretmek için kullanılır (WP-MORNING Faz 1).
 *
 * Neden ayrı dosya: 14 ana rotalık `MAIN_NAVIGATION` ile 55 kayıtlı rota AYNI ŞEY
 * DEĞİLDİR (bkz. HANDOFF §2.3). Ortak kalite tabanı (quality-baseline.authed.spec.js)
 * yalnız MAIN_NAVIGATION'ı dolaşır; bu envanter tüm kayıtlı yüzeyi kapsar.
 *
 * Başlık metadata'sı `MAIN_NAVIGATION`'dan yeniden kullanılır; derin rotalarda başlık
 * BİLİNMİYORSA `null`'dır ve spec başlık UYDURMAZ (yalnız yüzey/URL doğrular).
 */

/** MAIN_NAVIGATION başlık metadata'sı: path → beklenen sayfa başlığı. */
const HEADING_BY_PATH = new Map(MAIN_NAVIGATION.map(({ path, heading }) => [path, heading]));

/**
 * Bir rota sözleşmesini doğrular; geçersizse fırlatır (fail-closed).
 * Kabul edilen: production-içi, '/' ile başlayan, query/fragment/origin İÇERMEYEN pathname.
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
 * Sayfa sözleşmelerinden deterministik + tekilleştirilmiş rota envanteri üretir.
 * Sıra: `TESTED_PAGES` sırasında İLK GÖRÜLME (stabil). Aynı rota birden çok sözleşmede
 * geçse bile tek kayıt üretir. Her rota `assertValidRoutePath` ile doğrulanır.
 * @param {ReadonlyArray<{ routes?: ReadonlyArray<string> }>} pages
 * @returns {ReadonlyArray<{ path: string, heading: string|null }>}
 */
export function buildRegisteredRoutes(pages) {
  const seen = new Set();
  const out = [];
  for (const page of pages) {
    for (const route of page.routes || []) {
      assertValidRoutePath(route);
      if (seen.has(route)) continue;
      seen.add(route);
      out.push(Object.freeze({ path: route, heading: HEADING_BY_PATH.get(route) ?? null }));
    }
  }
  if (out.length === 0) throw new Error('Kayıtlı rota envanteri boş olamaz.');
  return Object.freeze(out);
}

/** Kanonik, tekilleştirilmiş kayıtlı rota envanteri (path + biliniyorsa heading). */
export const REGISTERED_ROUTES = buildRegisteredRoutes(TESTED_PAGES);

/** Yalnız path dizgeleri (araç/karşılaştırma kolaylığı için). */
export const REGISTERED_ROUTE_PATHS = Object.freeze(REGISTERED_ROUTES.map((r) => r.path));

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
 * Bir rota için kanonik read-only baseline test başlığını üretir. `[route:...]`
 * makine-okur işareti + `@smoke @route-baseline` etiketleri taşır. Spec ve self-check
 * AYNI üretici üzerinden çalışır → işaret/etiket sapması olamaz.
 * @param {string} path
 * @returns {string}
 */
export function routeBaselineTitle(path) {
  return `[route:${path}] kayıtlı rota read-only baseline @smoke @route-baseline`;
}
