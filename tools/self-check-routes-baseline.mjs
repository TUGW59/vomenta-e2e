// @ts-check
/**
 * ROTA-BASELINE SELF-CHECK — SERT KAPI (WP-MORNING Faz 1).
 *
 * `tests/contracts/registered-routes.js` envanteri ile
 * `tests/registered-routes-smoke.authed.spec.js`'in GERÇEKTEN ürettiği
 * `[route:...] @route-baseline` testleri arasında birebirliği zorlar:
 *   - her kayıtlı rota için TAM 1 baseline testi (eksik yok)
 *   - kayıtsız rota için baseline işareti YOK (fazla yok)
 *   - yinelenen rota işareti yok
 *   - 0 kayıtlı rota veya 0 seçilen test → non-zero
 * Ayrıca envanter üreticisi + işaret çözümleyicinin sentetik negatif vakalarını
 * (dedupe, geçersiz sözleşme reddi, deep-path/kök '/' ayrıştırma) doğrular.
 *
 * Çalıştır:  node tools/self-check-routes-baseline.mjs   (veya: npm run quality:routes-baseline)
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  REGISTERED_ROUTES,
  REGISTERED_ROUTE_PATHS,
  buildRegisteredRoutes,
  assertValidRoutePath,
  parseRouteMarker,
  routeBaselineTitle,
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

// ──────────────────── 2) Sentetik negatifler (üretici + parser) ────────────────────
// Yinelenen rota tek kayda iner.
const syntheticDupe = buildRegisteredRoutes([{ routes: ['/a', '/a', '/b'] }, { routes: ['/b'] }]);
if (syntheticDupe.length !== 2) {
  fail(`Sentetik dedupe başarısız: /a,/a,/b,/b → ${syntheticDupe.length} kayıt (2 beklenir).`);
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

// İşaret çözümleyici deep-path ve kök '/' ile başlığı doğru ayrıştırır.
if (parseRouteMarker(routeBaselineTitle('/settings/profile')) !== '/settings/profile') {
  fail('Parser: deep path işareti çözülemedi.');
}
if (parseRouteMarker(routeBaselineTitle('/')) !== '/') {
  fail("Parser: kök '/' işareti çözülemedi.");
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
  const markers = [];
  const walk = (suite) => {
    for (const sp of suite.specs || []) {
      const tags = (sp.tags || []).map((t) => String(t).replace(/^@/, ''));
      const marker = parseRouteMarker(`${suite.title || ''} ${sp.title || ''}`);
      if (tags.includes('route-baseline')) {
        if (!marker) fail(`@route-baseline testinde [route:] işareti yok: ${sp.title}`);
        else markers.push(marker);
      } else if (marker) {
        fail(`Baseline spec'te etiketsiz [route:] işareti: ${sp.title}`);
      }
    }
    for (const child of suite.suites || []) walk(child);
  };
  for (const s of report.suites || []) walk(s);

  if (markers.length === 0) {
    fail('0 route-baseline testi seçildi (spec işareti/etiketi eksik olabilir).');
  }

  const seen = new Set();
  for (const m of markers) {
    if (seen.has(m)) fail(`Bir rota için birden çok baseline testi: ${m}`);
    seen.add(m);
  }

  const registered = new Set(REGISTERED_ROUTE_PATHS);
  for (const r of registered) {
    if (!seen.has(r)) fail(`Kayıtlı rota için baseline testi EKSİK: ${r}`);
  }
  for (const m of seen) {
    if (!registered.has(m)) fail(`Kayıtsız rota için baseline işareti (FAZLA): ${m}`);
  }
  if (markers.length !== registered.size) {
    fail(`Baseline test sayısı (${markers.length}) ≠ kayıtlı rota sayısı (${registered.size}).`);
  }
}

// ─────────────────────────────── Sonuç ───────────────────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} rota-baseline self-check ihlali.`);
  process.exit(1);
}
console.log(
  `Rota-baseline self-check geçti: ${REGISTERED_ROUTES.length} kayıtlı rota = ` +
    `${REGISTERED_ROUTES.length} read-only baseline testi (eksik/fazla/yinelenen yok).`
);
