// @ts-check
/**
 * KANONİK ÜRÜN YÜZEYİ REGISTRY SELF-CHECK — SERT KAPI (WP-SURFACE-REGISTRY / ADR-0018).
 *
 * İki şeyi kanıtlar:
 *   1) GERÇEK `PRODUCT_SURFACES` sözleşmesi geçerli (0 hata) ve temel değişmezleri taşır
 *      (tekil id, tekil rota, tanımlı parentId, dinamik yüzey sahte URL'ye çevrilmemiş).
 *   2) Validator NEGATİF vakalarda GERÇEKTEN non-zero döner (sentetik registry'ler).
 *      Yani kapı fail-closed: bozuk bir yüzey sessizce geçemez.
 *
 * SAF/SENTETİK: production'a trafik yok. Yalnız validator kütüphanesi + statik literal.
 *
 * Çalıştır:  node tools/self-check-surface-registry.mjs   (npm run quality:surface-registry)
 */
import {
  PRODUCT_SURFACES,
  SURFACE_IDS,
  SURFACE_STATIC_ROUTES,
  validateSurface,
  validateRegistry,
  assertValidSurfaceRoute,
} from '../tests/contracts/product-surfaces.js';

const errors = [];
const fail = (m) => errors.push(m);

/** Geçerli bir temel yüzey (negatif vakalarda tek alanı bozmak için taban). */
const base = () => ({
  id: 'x-surface',
  area: 'x',
  route: '/x',
  routeKind: 'static',
  lifecycle: 'active',
  parentId: null,
  navigation: 'main',
  runtimePolicy: 'readonly-baseline',
  evidence: [{ type: 'route-inventory' }],
});

/** Verilen registry'nin EN AZ bir hata üretmesini bekler; üretmezse self-check patlar. */
function expectInvalid(label, registry) {
  const errs = validateRegistry(registry);
  if (errs.length === 0) fail(`Sentetik negatif GEÇTİ (beklenen: reddedilir): ${label}`);
}

// ───────────────────────── 1) GERÇEK registry sağlığı ─────────────────────────
const realErrs = validateRegistry(PRODUCT_SURFACES);
if (realErrs.length) {
  fail(`GERÇEK PRODUCT_SURFACES geçersiz (${realErrs.length}):`);
  for (const e of realErrs) fail(`  · ${e}`);
}
if (PRODUCT_SURFACES.length === 0) fail('PRODUCT_SURFACES boş.');

// Tekil id
if (new Set(SURFACE_IDS).size !== SURFACE_IDS.length) fail('Yinelenen yüzey id (tekilleştirme bozuk).');
// Tekil statik rota
if (new Set(SURFACE_STATIC_ROUTES).size !== SURFACE_STATIC_ROUTES.length) fail('Yinelenen statik rota.');
// Registry test-kapsamı bilgisi TAŞIMAMALI (spec/tag/coverage sızıntısı yok)
const FORBIDDEN_KEYS = ['spec', 'specFiles', 'archetype', 'styleTag', 'covered', 'tested', 'tests', 'coverage'];
for (const s of PRODUCT_SURFACES) {
  for (const k of FORBIDDEN_KEYS) {
    if (k in s) fail(`Registry kapsam bilgisi taşıyamaz ('${k}' bulundu): ${s.id}`);
  }
}
// Dinamik yüzeyler sahte gerçek URL'ye çevrilmemiş (':param' şablonu + fixture-required)
for (const s of PRODUCT_SURFACES.filter((x) => x.routeKind === 'dynamic')) {
  if (!/\/:[a-zA-Z]/.test(s.route)) fail(`Dinamik yüzey ':param' şablonu taşımıyor (sahte URL riski): ${s.id}`);
  if (s.runtimePolicy !== 'fixture-required') fail(`Dinamik yüzey fixture-required değil: ${s.id}`);
}
// parentId referans bütünlüğü (çift kontrol)
const idSet = new Set(SURFACE_IDS);
for (const s of PRODUCT_SURFACES) {
  if (s.parentId != null && !idSet.has(s.parentId)) fail(`Kırık parentId: ${s.id} → ${s.parentId}`);
}

// ──────────────────── 2) Sentetik NEGATİF vakalar (fail-closed kanıtı) ────────────────────
// boş registry
expectInvalid('boş registry', []);
// duplicate id
expectInvalid('duplicate id', [base(), { ...base(), route: '/y' }]);
// duplicate/çakışan statik route
expectInvalid('çakışan statik route', [base(), { ...base(), id: 'x2' }]);
// geçersiz route (formatsız)
expectInvalid('geçersiz route', [{ ...base(), route: 'x' }]);
expectInvalid('boş route', [{ ...base(), route: '' }]);
// query/fragment/origin route
expectInvalid('query route', [{ ...base(), route: '/x?y=1' }]);
expectInvalid('fragment route', [{ ...base(), route: '/x#f' }]);
expectInvalid('origin route', [{ ...base(), route: 'https://app.vomenta.com/x' }]);
expectInvalid('süslü-parantez route', [{ ...base(), route: '/x/{id}' }]);
// statik yüzeyde ':param' (routeKind tutarsız)
expectInvalid('statik route :param taşıyor', [{ ...base(), route: '/x/:id' }]);
// dynamic rota için eksik policy / eksik ':param'
expectInvalid('dynamic eksik policy', [
  { ...base(), id: 'd', route: '/d/:id', routeKind: 'dynamic', runtimePolicy: 'readonly-baseline' },
]);
expectInvalid('dynamic param segmenti yok', [
  { ...base(), id: 'd2', route: '/d2', routeKind: 'dynamic', runtimePolicy: 'fixture-required', fixtureRef: null, blockedReason: 'READONLY_FIXTURE_ID_REQUIRED' },
]);
expectInvalid('dynamic eksik blockedReason', [
  { ...base(), id: 'd3', route: '/d3/:id', routeKind: 'dynamic', runtimePolicy: 'fixture-required', fixtureRef: null },
]);
// redirect için eksik hedef
expectInvalid('redirect eksik target', [{ ...base(), id: 'r', route: '/r', routeKind: 'redirect' }]);
expectInvalid('redirect geçersiz target', [
  { ...base(), id: 'r2', route: '/r2', routeKind: 'redirect', redirectTarget: 'notapath' },
]);
// conditional için eksik koşul
expectInvalid('conditional eksik condition', [{ ...base(), lifecycle: 'conditional' }]);
// deprecated için eksik migration
expectInvalid('deprecated eksik migrationRef', [{ ...base(), lifecycle: 'deprecated' }]);
// bilinmeyen enum / reason code
expectInvalid('bilinmeyen routeKind', [{ ...base(), routeKind: 'weird' }]);
expectInvalid('bilinmeyen lifecycle', [{ ...base(), lifecycle: 'zombie' }]);
expectInvalid('bilinmeyen navigation', [{ ...base(), navigation: 'sidebar' }]);
expectInvalid('bilinmeyen runtimePolicy', [{ ...base(), runtimePolicy: 'yolo' }]);
expectInvalid('bilinmeyen evidence.type', [{ ...base(), evidence: [{ type: 'gut-feeling' }] }]);
expectInvalid('bilinmeyen blockedReason', [
  { ...base(), runtimePolicy: 'readonly-blocked', blockedReason: 'NOPE' },
]);
// eksik kanıt
expectInvalid('kanıtsız yüzey', [{ ...base(), evidence: [] }]);
// kendini parent yapan yüzey
expectInvalid('self-parent', [{ ...base(), parentId: 'x-surface' }]);
// kırık parentId referansı
expectInvalid('kırık parentId', [{ ...base(), id: 'child', route: '/c', parentId: 'ghost' }]);
// geçersiz observedAt
expectInvalid('geçersiz observedAt', [
  { ...base(), evidence: [{ type: 'discovery-observation', observedAt: '07/30/2026' }] },
]);

// ─────────────── 3) POZİTİF ayrık kontroller (validator gerçekten ayırt ediyor) ───────────────
// Geçerli tekil yüzey 0 hata döndürmeli
if (validateSurface(base()).length !== 0) fail('Geçerli temel yüzey hatalı sayıldı (yanlış-pozitif).');
// route validator: geçerli statik + dinamik yollar geçmeli
try { assertValidSurfaceRoute('/a/b'); } catch { fail('Geçerli statik yol reddedildi.'); }
try { assertValidSurfaceRoute('/a/:id', { dynamic: true }); } catch { fail('Geçerli dinamik şablon reddedildi.'); }

// ─────────────────────────────── Sonuç ───────────────────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} surface-registry self-check ihlali.`);
  process.exit(1);
}
console.log(
  `Surface-registry self-check geçti: ${PRODUCT_SURFACES.length} kanonik yüzey ` +
    `(${SURFACE_STATIC_ROUTES.length} statik + ${PRODUCT_SURFACES.length - SURFACE_STATIC_ROUTES.length} dinamik/redirect), ` +
    `0 gerçek hata, tüm sentetik negatifler fail-closed reddedildi.`
);
