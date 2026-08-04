// @ts-check
/**
 * SURFACE COMPLETENESS SELF-CHECK — SERT KAPI (WP-SURFACE-GATE / FAZ 2 / ADR-0019).
 *
 * İKİ ŞEYİ kanıtlar:
 *   1) GERÇEK repo ağacı: tüm gözlem kaynakları (navigation / coverage-contract /
 *      coverage-baseline / route-marker / known-bug / runtime / discovery / pr-impact)
 *      kanonik `PRODUCT_SURFACES` ile TAM uzlaşıyor → 0 UNREGISTERED_OBSERVED,
 *      0 AMBIGUOUS, 0 zorunlu UNREFERENCED. Gate GERÇEK ağaçta yeşil.
 *   2) SENTETİK NEGATİFLER gerçekten non-zero: her kaynağa registry dışı / yanlış-template /
 *      belirsiz rota enjekte edilince kapı KIRILIR; sıfır-gözlem / sıfır-envanter sahte-
 *      yeşili REDDEDİLİR; yalnız main-navigation ile dedicated kapsam iddiası kabul edilmez.
 *
 * SAF/SENTETİK — production'a trafik/mutation YOK. Negatifler yalnız saf modele veri enjekte eder.
 *
 * Çalıştır:  node tools/self-check-surface-completeness.mjs   (npm run quality:surface-completeness)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { PRODUCT_SURFACES } from '../tests/contracts/product-surfaces.js';
import { REGISTERED_ROUTE_PATHS } from '../tests/contracts/registered-routes.js';
import { MAIN_NAVIGATION } from '../tests/contracts/navigation.js';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';
import { TESTED_PAGES } from '../tests/contracts/tested-pages.js';
import {
  reconcile,
  validateCompleteness,
  classifyCoverageContracts,
  isDedicatedlyCovered,
  buildPrImpactSurfaceMap,
  matchSurface,
  normalizeRoute,
  RECONCILE_REASONS,
} from './surface-completeness-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const errors = [];
const fail = (m) => errors.push(m);

/** JSON dosyasını güvenli oku (yoksa null). */
function readJson(rel) {
  try {
    return JSON.parse(readFileSync(resolve(repoRoot, rel), 'utf8'));
  } catch {
    return null;
  }
}

// ───────────────────────── GERÇEK gözlem kaynaklarını topla ─────────────────────────
const runtime = readJson('docs/raporlar/TEST-SONUCLARI.json') || {};
const discovery = readJson('tests/contracts/discovery-baseline.json') || { routes: {} };
const coverage = classifyCoverageContracts(TESTED_PAGES);
const prImpact = buildPrImpactSurfaceMap(TESTED_PAGES);

const runtimeRoutes = [
  ...((runtime.pages || []).map((p) => p.route)),
  ...((runtime.unmappedTests || []).map((u) => u.routeMarker).filter(Boolean)),
];

/** GERÇEK kaynak seti (≥6 farklı kaynak). */
const realSources = [
  { kind: 'navigation', routes: MAIN_NAVIGATION.map((n) => n.path) },
  { kind: 'coverage-contract', routes: coverage.dedicated },
  { kind: 'coverage-baseline', routes: coverage.baseline },
  { kind: 'route-marker', routes: [...REGISTERED_ROUTE_PATHS] },
  { kind: 'known-bug', routes: KNOWN_BUGS.map((b) => b.route).filter(Boolean) },
  { kind: 'runtime', routes: runtimeRoutes },
  { kind: 'discovery', routes: Object.keys(discovery.routes || {}) },
  { kind: 'pr-impact', routes: prImpact.routes },
];

// ───────────────────────── 1) GERÇEK ağaç YEŞİL olmalı ─────────────────────────
const realModel = reconcile({ surfaces: PRODUCT_SURFACES, sources: realSources, generatedAt: null });
const realErrs = validateCompleteness(realModel, PRODUCT_SURFACES);
if (realErrs.length) {
  fail(`GERÇEK ağaç completeness KIRIK (${realErrs.length}):`);
  for (const e of realErrs) fail(`  · ${e}`);
}
if (realModel.inventory.sources < 6) fail(`Gerçek kaynak sayısı 6'dan az: ${realModel.inventory.sources}`);
if (realModel.totals.observations === 0) fail('Gerçek gözlem sıfır (beklenmiyor).');

// ───────────────────────── 2) SENTETİK NEGATİFLER (fail-closed kanıtı) ─────────────────────────
/** Verilen kaynak setinin EN AZ bir completeness ihlali üretmesini bekler. */
function expectBroken(label, sources, surfaces = PRODUCT_SURFACES) {
  const m = reconcile({ surfaces, sources });
  const errs = validateCompleteness(m, surfaces);
  if (errs.length === 0) fail(`Sentetik negatif GEÇTİ (beklenen: kapı kırılır): ${label}`);
}

/** Gerçek kaynaklara SIĞ kopya (mutasyon izole). */
const clone = () => realSources.map((s) => ({ kind: s.kind, routes: [...s.routes] }));
/** Belirli kaynağa bozuk rota ekle. */
function withInjected(kind, route) {
  const s = clone();
  const t = s.find((x) => x.kind === kind);
  t.routes = [...t.routes, route];
  return s;
}

// Her kaynağa registry DIŞI rota → gate kırılır (HANDOFF FAZ 2 §Zorunlu negatif kanıtlar).
expectBroken('navigation registry-dışı route', withInjected('navigation', '/ghost-nav'));
expectBroken('known-bug registry-dışı route', withInjected('known-bug', '/ghost-bug'));
expectBroken('route-marker registry-dışı route', withInjected('route-marker', '/ghost-marker'));
expectBroken('runtime registry-dışı route', withInjected('runtime', '/ghost-runtime'));
expectBroken('discovery registry-dışı route', withInjected('discovery', '/ghost-discovery'));
expectBroken('coverage-contract registry-dışı route', withInjected('coverage-contract', '/ghost-contract'));
expectBroken('pr-impact registry-dışı route', withInjected('pr-impact', '/ghost-impact'));

// Dinamik instance YANLIŞ template'e bağlanır → gate kırılır.
expectBroken('dynamic yanlış template (bilinmeyen parent)', withInjected('discovery', '/ghost-parent/12345'));
expectBroken('dynamic yanlış template (fazla segment)', withInjected('runtime', '/bot-builder/12/extra'));

// Aynı rota iki yüzeye BELİRSİZ eşleşir → gate kırılır (sentetik çakışan template registry).
{
  const surfaces = [
    ...PRODUCT_SURFACES,
    { id: 'amb-a', area: 'x', route: '/amb/:a', routeKind: 'dynamic', lifecycle: 'active', parentId: null, navigation: 'hidden', runtimePolicy: 'fixture-required', fixtureRef: null, blockedReason: 'READONLY_FIXTURE_ID_REQUIRED', evidence: [{ type: 'route-inventory' }] },
    { id: 'amb-b', area: 'x', route: '/amb/:b', routeKind: 'dynamic', lifecycle: 'active', parentId: null, navigation: 'hidden', runtimePolicy: 'fixture-required', fixtureRef: null, blockedReason: 'READONLY_FIXTURE_ID_REQUIRED', evidence: [{ type: 'route-inventory' }] },
  ];
  const sources = [...clone(), { kind: 'discovery', routes: ['/amb/foo'] }];
  // (discovery iki kez olur; reconcile birleştirmez ama belirsizlik yine yakalanır)
  const m = reconcile({ surfaces, sources });
  const hit = m.ambiguous.some((a) => a.route === '/amb/foo');
  if (!hit) fail('Belirsiz eşleşme yakalanmadı (amb-a/amb-b).');
  const errs = validateCompleteness(m, surfaces);
  if (errs.length === 0) fail('Belirsiz eşleşme completeness kapısını kırmadı.');
}

// Sıfır gözlem / sıfır envanter → sahte-yeşil reddedilir.
expectBroken('sıfır gözlem (boş kaynaklar)', [
  { kind: 'navigation', routes: [] }, { kind: 'coverage-contract', routes: [] },
  { kind: 'coverage-baseline', routes: [] }, { kind: 'route-marker', routes: [] },
  { kind: 'known-bug', routes: [] }, { kind: 'runtime', routes: [] },
]);
{
  const m = reconcile({ surfaces: [], sources: realSources });
  const errs = validateCompleteness(m, []);
  if (errs.length === 0) fail('Boş envanter sahte-yeşili reddedilmedi.');
}
// <6 kaynak → reddedilir.
expectBroken('yetersiz kaynak (<6)', realSources.slice(0, 3));

// Zorunlu-referanslı registry yüzeyi hiçbir kaynakta yok → gate kırılır.
{
  const surfaces = [
    ...PRODUCT_SURFACES,
    { id: 'orphan-baseline', area: 'x', route: '/orphan-baseline-surface', routeKind: 'static', lifecycle: 'active', parentId: null, navigation: 'hidden', runtimePolicy: 'readonly-baseline', evidence: [{ type: 'route-inventory' }] },
  ];
  const m = reconcile({ surfaces, sources: realSources });
  const isUnref = m.unreferencedRegistered.some((u) => u.surfaceId === 'orphan-baseline' && u.referenceRequired);
  if (!isUnref) fail('Referanssız readonly-baseline yüzey unreferenced işaretlenmedi.');
  const errs = validateCompleteness(m, surfaces);
  if (errs.length === 0) fail('Referanssız zorunlu yüzey completeness kapısını kırmadı.');
}

// ───────────────────────── 3) POZİTİF ayrık kontroller (motor gerçekten ayırt ediyor) ─────────────────────────
// main-navigation DEDICATED kapsam SAYILMAZ.
{
  // Yalnız main-navigation'da olan bir rota dedicated sayılmamalı.
  const navOnly = MAIN_NAVIGATION.map((n) => normalizeRoute(n.path)).find((r) => !coverage.dedicated.includes(r));
  if (navOnly && isDedicatedlyCovered(navOnly, TESTED_PAGES)) {
    fail(`main-navigation rotası dedicated kapsam sayıldı (yanlış-pozitif): ${navOnly}`);
  }
  // Sahte "dedicated" iddiası: routeLevelBaseline sözleşmeye rota koyup dedicated bekleme.
  const fakePages = [{ id: 'main-navigation', routes: ['/fake-nav-only'], specFiles: ['quality-baseline.authed.spec.js'], routeLevelBaseline: true }];
  if (isDedicatedlyCovered('/fake-nav-only', fakePages)) fail('routeLevelBaseline rota dedicated sayıldı (sahte kapsam).');
}
// dinamik instance DOĞRU template'e bağlanır (bot-builder).
{
  const m = matchSurface('/bot-builder/{id}', PRODUCT_SURFACES);
  if (!(m.matched && m.surfaceId === 'bot-builder-detail' && m.kind === 'dynamic')) {
    fail(`Dinamik instance doğru template'e bağlanmadı: ${JSON.stringify(m)}`);
  }
}
// query taşıyan rota fail-closed (kayıtsız) sayılır.
{
  const m = matchSurface('/ai?tab=x', PRODUCT_SURFACES);
  if (m.matched) fail('Query taşıyan rota yanlışlıkla eşleşti (fail-closed bekleniyordu).');
}
// trailing-slash normalize: '/ai/' → '/ai' eşleşir.
{
  const m = matchSurface('/ai/', PRODUCT_SURFACES);
  if (!(m.matched && m.surfaceId === 'ai')) fail("Trailing-slash normalize başarısız ('/ai/' → 'ai').");
}
// Registry reason sözlüğü tam (regresyon guard).
for (const k of ['UNREGISTERED_OBSERVED', 'DYNAMIC_TEMPLATE_MISMATCH', 'AMBIGUOUS_SURFACE_MATCH', 'UNREFERENCED_REGISTERED']) {
  if (!RECONCILE_REASONS[k]) fail(`RECONCILE_REASONS eksik: ${k}`);
}

// ───────────────────────────────── Sonuç ─────────────────────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} surface-completeness self-check ihlali.`);
  process.exit(1);
}
console.log(
  `Surface-completeness self-check geçti: ${PRODUCT_SURFACES.length} kanonik yüzey × ` +
    `${realModel.inventory.sources} kaynak (${realModel.totals.observations} gözlem) uzlaştırıldı — ` +
    `0 UNREGISTERED_OBSERVED, 0 AMBIGUOUS, ${realModel.totals.unreferencedRequired} zorunlu UNREFERENCED; ` +
    `tüm sentetik negatifler fail-closed reddedildi.`
);
