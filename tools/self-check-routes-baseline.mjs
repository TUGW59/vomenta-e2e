// @ts-check
/**
 * ROTA-BASELINE SELF-CHECK — SERT KAPI (WP-MORNING Faz 1 + WP-SURFACE-MIGRATION / FAZ 3).
 *
 * `tests/contracts/registered-routes.js` envanteri (artık kanonik `PRODUCT_SURFACES`'ten
 * türetilir) ile `tests/registered-routes-smoke.authed.spec.js`'in GERÇEKTEN ürettiği
 * runtime-policy'ye göre AYRIK baseline testleri arasında birebirliği zorlar:
 *   - RUNNABLE (readonly-baseline) yüzey → TAM 1 `@route-baseline` testi
 *   - BLOCKED (fixture-required/readonly-blocked/staging-only) → TAM 1 `@route-blocked` testi
 *   - REDIRECT (routeKind=redirect) → TAM 1 `@route-redirect` testi
 *   - kayıtsız rota için işaret YOK (fazla yok); yinelenen yok
 *   - baseline test SAYISI runtime-policy ile açıklanabilir (runnable=#readonly-baseline)
 *   - 0 kayıtlı rota veya 0 seçilen test → non-zero
 * Ayrıca envanter üreticisi + işaret çözümleyicinin sentetik negatif vakalarını doğrular.
 *
 * Çalıştır:  node tools/self-check-routes-baseline.mjs   (veya: npm run quality:routes-baseline)
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  REGISTERED_ROUTES,
  REGISTERED_ROUTE_PATHS,
  RUNNABLE_ROUTES,
  BLOCKED_ROUTES,
  REDIRECT_ROUTES,
  buildRegisteredRoutes,
  assertValidRoutePath,
  baselineKindForSurface,
  parseRouteMarker,
  routeBaselineTitle,
  routeBlockedTitle,
  routeRedirectTitle,
} from '../tests/contracts/registered-routes.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = 'tests/registered-routes-smoke.authed.spec.js';

const errors = [];
const fail = (m) => errors.push(m);

// ─────────────────────────── 1) Envanter sağlığı ───────────────────────────
if (REGISTERED_ROUTES.length === 0) fail('Kayıtlı rota envanteri boş.');

const dupes = [...new Set(REGISTERED_ROUTE_PATHS.filter((p, i) => REGISTERED_ROUTE_PATHS.indexOf(p) !== i))];
if (dupes.length) fail(`Envanterde yinelenen rota (tekilleştirme bozuk): ${dupes.join(', ')}`);

for (const p of REGISTERED_ROUTE_PATHS) {
  try {
    assertValidRoutePath(p);
  } catch (e) {
    fail(`Geçersiz kayıtlı rota: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// Baseline partisyonu tam örtüşmeli (her rota tam bir baseline türü).
if (RUNNABLE_ROUTES.length + BLOCKED_ROUTES.length + REDIRECT_ROUTES.length !== REGISTERED_ROUTES.length) {
  fail(
    `Baseline partisyonu envanteri kapsamıyor: runnable ${RUNNABLE_ROUTES.length} + blocked ` +
      `${BLOCKED_ROUTES.length} + redirect ${REDIRECT_ROUTES.length} ≠ ${REGISTERED_ROUTES.length}.`
  );
}

// ──────────────────── 2) Sentetik negatifler (üretici + parser) ────────────────────
/** Sentetik yüzey fabrikası (buildRegisteredRoutes yüzey nesnesi bekler). */
const surf = (route, over = {}) => ({
  id: `s${route.replace(/[^a-z0-9]+/gi, '-')}`, area: 'x', route,
  routeKind: 'static', lifecycle: 'active', navigation: 'hidden',
  runtimePolicy: 'readonly-baseline', ...over,
});

// Yinelenen rota tek kayda iner.
const syntheticDupe = buildRegisteredRoutes([surf('/a'), surf('/a', { id: 'sa2' }), surf('/b')]);
if (syntheticDupe.length !== 2) {
  fail(`Sentetik dedupe başarısız: /a,/a,/b → ${syntheticDupe.length} kayıt (2 beklenir).`);
}

// runtime-policy → baseline türü doğru türetilir.
if (baselineKindForSurface({ routeKind: 'static', runtimePolicy: 'readonly-baseline' }) !== 'runnable') {
  fail('baselineKindForSurface: readonly-baseline → runnable değil.');
}
for (const pol of ['fixture-required', 'readonly-blocked', 'staging-only']) {
  if (baselineKindForSurface({ routeKind: 'static', runtimePolicy: pol }) !== 'blocked') {
    fail(`baselineKindForSurface: ${pol} → blocked değil.`);
  }
}
if (baselineKindForSurface({ routeKind: 'redirect', runtimePolicy: 'readonly-baseline' }) !== 'redirect') {
  fail('baselineKindForSurface: routeKind=redirect → redirect değil.');
}

// Geçersiz rota sözleşmesi reddedilir.
for (const bad of ['', '   ', 'contacts', 'https://app.vomenta.com/x', '/x?y=1', '/x#f', '/x y']) {
  let threw = false;
  try {
    assertValidRoutePath(bad);
  } catch {
    threw = true;
  }
  if (!threw) fail(`Sentetik: geçersiz rota reddedilmedi: ${JSON.stringify(bad)}`);
}

// İşaret çözümleyici deep-path, kök '/', blocked ve redirect başlıklarını doğru ayrıştırır.
if (parseRouteMarker(routeBaselineTitle('/settings/profile')) !== '/settings/profile') {
  fail('Parser: deep path işareti çözülemedi.');
}
if (parseRouteMarker(routeBaselineTitle('/')) !== '/') {
  fail("Parser: kök '/' işareti çözülemedi.");
}
if (parseRouteMarker(routeBlockedTitle('/bot-builder/:id', 'READONLY_FIXTURE_ID_REQUIRED')) !== '/bot-builder/:id') {
  fail('Parser: blocked işareti (dinamik) çözülemedi.');
}
if (parseRouteMarker(routeRedirectTitle('/old', '/new')) !== '/old') {
  fail('Parser: redirect işareti çözülemedi.');
}
if (parseRouteMarker('işaretsiz başlık') !== null) {
  fail('Parser: işaretsiz başlık null dönmedi.');
}

// ──────────────── 3) Gerçek spec --list ile envanter ↔ test çapraz kontrolü ────────────────
let report = null;
try {
  const raw = execSync(
    `npx playwright test ${SPEC} --project=chromium-authed --list --reporter=json`,
    { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['pipe', 'pipe', 'ignore'] }
  );
  report = JSON.parse(raw);
} catch (e) {
  fail(`Spec --list çalıştırılamadı/ayrıştırılamadı: ${e instanceof Error ? e.message : String(e)}`);
}

if (report) {
  // Etikete göre işaret kümeleri: her baseline türü ayrı toplanır.
  const byTag = { 'route-baseline': [], 'route-blocked': [], 'route-redirect': [] };
  const walk = (suite) => {
    for (const sp of suite.specs || []) {
      const tags = (sp.tags || []).map((t) => String(t).replace(/^@/, ''));
      const marker = parseRouteMarker(`${suite.title || ''} ${sp.title || ''}`);
      const kinds = Object.keys(byTag).filter((k) => tags.includes(k));
      if (kinds.length > 1) fail(`Bir testte birden çok baseline etiketi: ${sp.title}`);
      if (kinds.length === 1) {
        if (!marker) fail(`@${kinds[0]} testinde [route:] işareti yok: ${sp.title}`);
        else byTag[kinds[0]].push(marker);
      } else if (marker) {
        fail(`Baseline spec'te etiketsiz [route:] işareti: ${sp.title}`);
      }
    }
    for (const child of suite.suites || []) walk(child);
  };
  for (const s of report.suites || []) walk(s);

  const allMarkers = [...byTag['route-baseline'], ...byTag['route-blocked'], ...byTag['route-redirect']];
  if (allMarkers.length === 0) {
    fail('0 route-* baseline testi seçildi (spec işareti/etiketi eksik olabilir).');
  }

  // Türe göre birebir eşleşme: markers[kind] == beklenen rota kümesi.
  const check = (label, markers, expectedPaths) => {
    const seen = new Set();
    for (const m of markers) {
      if (seen.has(m)) fail(`[${label}] bir rota için birden çok test: ${m}`);
      seen.add(m);
    }
    const expected = new Set(expectedPaths);
    for (const r of expected) if (!seen.has(r)) fail(`[${label}] rota için test EKSİK: ${r}`);
    for (const m of seen) if (!expected.has(m)) fail(`[${label}] beklenmeyen rota işareti (FAZLA): ${m}`);
    if (markers.length !== expected.size) {
      fail(`[${label}] test sayısı (${markers.length}) ≠ beklenen rota sayısı (${expected.size}).`);
    }
  };
  check('route-baseline', byTag['route-baseline'], RUNNABLE_ROUTES.map((r) => r.path));
  check('route-blocked', byTag['route-blocked'], BLOCKED_ROUTES.map((r) => r.path));
  check('route-redirect', byTag['route-redirect'], REDIRECT_ROUTES.map((r) => r.path));

  // Birleşik: tüm işaretler tam olarak kayıtlı envanteri kapsar (eksik/fazla/yinelenen yok).
  const registered = new Set(REGISTERED_ROUTE_PATHS);
  const seenAll = new Set();
  for (const m of allMarkers) {
    if (seenAll.has(m)) fail(`Bir rota birden çok baseline türünde: ${m}`);
    seenAll.add(m);
  }
  for (const r of registered) if (!seenAll.has(r)) fail(`Kayıtlı rota için baseline testi EKSİK: ${r}`);
  for (const m of seenAll) if (!registered.has(m)) fail(`Kayıtsız rota için baseline işareti (FAZLA): ${m}`);
  if (allMarkers.length !== registered.size) {
    fail(`Toplam baseline test (${allMarkers.length}) ≠ kayıtlı rota (${registered.size}).`);
  }
}

// ─────────────────────────────── Sonuç ───────────────────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} rota-baseline self-check ihlali.`);
  process.exit(1);
}
console.log(
  `Rota-baseline self-check geçti: ${REGISTERED_ROUTES.length} kayıtlı yüzey = ` +
    `${RUNNABLE_ROUTES.length} runnable (@route-baseline) + ${BLOCKED_ROUTES.length} blocked ` +
    `(@route-blocked) + ${REDIRECT_ROUTES.length} redirect (@route-redirect); ` +
    `runtime-policy ile birebir açıklanır (eksik/fazla/yinelenen yok).`
);
