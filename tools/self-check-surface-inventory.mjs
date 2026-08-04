// @ts-check
/**
 * SURFACE-INVENTORY SELF-CHECK — SERT KAPI (WP-SURFACE-RECONCILE / FAZ 4 / ADR-0021).
 *
 * İKİ ŞEYİ kanıtlar:
 *   1) GERÇEK repo ağacı: envanter modeli GERÇEK `PRODUCT_SURFACES` + kapsam sözleşmeleri +
 *      completeness uzlaştırmasından kurulur; 0 observed-but-unregistered, tutarlı sayımlar,
 *      sızıntı yok, deterministik.
 *   2) SENTETİK NEGATİFLER gerçekten non-zero: bozuk/eksik/tekrarlı model, secret/PII/mutlak-yol
 *      sızıntısı, tutarsız sayım → validateInventory KIRILIR.
 *
 * SAF/SENTETİK — production'a trafik/mutation YOK.
 * Çalıştır:  node tools/self-check-surface-inventory.mjs   (npm run quality:surface-inventory)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { PRODUCT_SURFACES } from '../tests/contracts/product-surfaces.js';
import { REGISTERED_ROUTE_PATHS } from '../tests/contracts/registered-routes.js';
import { MAIN_NAVIGATION } from '../tests/contracts/navigation.js';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';
import { TESTED_PAGES } from '../tests/contracts/tested-pages.js';
import { reconcile, classifyCoverageContracts, buildPrImpactSurfaceMap } from './surface-completeness-lib.mjs';
import {
  buildInventoryModel,
  validateInventory,
  renderInventoryJson,
  renderInventoryMd,
  scanForLeaks,
  INVENTORY_STATUS,
} from './surface-inventory-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (m) => errors.push(m);
const readJson = (rel) => { try { return JSON.parse(readFileSync(resolve(root, rel), 'utf8')); } catch { return null; } };

// ───────────────────────── GERÇEK model kur ─────────────────────────
const runtime = readJson('docs/raporlar/TEST-SONUCLARI.json') || {};
const discovery = readJson('tests/contracts/discovery-baseline.json') || { routes: {} };
const coverage = classifyCoverageContracts(TESTED_PAGES);
const prImpact = buildPrImpactSurfaceMap(TESTED_PAGES);
const sources = [
  { kind: 'navigation', routes: MAIN_NAVIGATION.map((n) => n.path) },
  { kind: 'coverage-contract', routes: coverage.dedicated },
  { kind: 'coverage-baseline', routes: coverage.baseline },
  { kind: 'route-marker', routes: [...REGISTERED_ROUTE_PATHS] },
  { kind: 'known-bug', routes: KNOWN_BUGS.map((b) => b.route).filter(Boolean) },
  { kind: 'runtime', routes: [...((runtime.pages || []).map((p) => p.route)), ...((runtime.unmappedTests || []).map((u) => u.routeMarker).filter(Boolean))] },
  { kind: 'discovery', routes: Object.keys(discovery.routes || {}) },
  { kind: 'pr-impact', routes: prImpact.routes },
];
const reconcileModel = reconcile({ surfaces: PRODUCT_SURFACES, sources, generatedAt: null });
/** @type {Record<string,string[]>} */
const contractsBySurfaceId = {};
for (const p of TESTED_PAGES) { if (p.routeLevelBaseline) continue; for (const sid of p.surfaceIds || []) (contractsBySurfaceId[sid] ||= []).push(p.id); }

const model = buildInventoryModel({
  surfaces: PRODUCT_SURFACES, dedicatedRoutes: coverage.dedicated, contractsBySurfaceId,
  reconcile: reconcileModel, heldCandidates: [], generatedAt: null,
});

// ───────────────────────── 1) GERÇEK model YEŞİL ─────────────────────────
const realErrs = validateInventory(model);
if (realErrs.length) { fail(`GERÇEK envanter modeli geçersiz (${realErrs.length}):`); for (const e of realErrs) fail('  · ' + e); }
if (model.totals.surfaces !== PRODUCT_SURFACES.length) fail(`Envanter yüzey sayısı registry ile uyuşmuyor: ${model.totals.surfaces} ≠ ${PRODUCT_SURFACES.length}`);
if (model.totals.observedButUnregistered !== 0) fail(`GERÇEK ağaçta observed-but-unregistered 0 değil: ${model.totals.observedButUnregistered}`);
if (model.totals.ambiguous !== 0) fail(`GERÇEK ağaçta ambiguous 0 değil: ${model.totals.ambiguous}`);
// her registry yüzeyi envanterde tam bir kez
if (new Set(model.sections.registeredSurfaces.map((r) => r.id)).size !== PRODUCT_SURFACES.length) fail('Bazı yüzeyler envanterde eksik/tekrarlı.');
// determinizm: iki üretim bit-identical
if (renderInventoryJson(model) !== renderInventoryJson(buildInventoryModel({ surfaces: PRODUCT_SURFACES, dedicatedRoutes: coverage.dedicated, contractsBySurfaceId, reconcile: reconcileModel, heldCandidates: [], generatedAt: null }))) {
  fail('Envanter JSON determinist değil (iki üretim farklı).');
}
if (typeof renderInventoryMd(model) !== 'string' || !renderInventoryMd(model).includes('SURFACE-INVENTORY')) fail('MD render başlığı eksik.');

// ───────────────────────── 2) SENTETİK NEGATİFLER ─────────────────────────
const expectInvalid = (label, m) => { if (validateInventory(m).length === 0) fail(`Sentetik negatif GEÇTİ (beklenen: reddedilir): ${label}`); };
// boş envanter
expectInvalid('boş registeredSurfaces', { schemaVersion: 1, totals: { surfaces: 0, byStatus: {} }, sections: { registeredSurfaces: [] } });
// yanlış schemaVersion
{ const m = JSON.parse(JSON.stringify(model)); m.schemaVersion = 999; expectInvalid('yanlış schemaVersion', m); }
// totals.surfaces uyuşmazlığı
{ const m = JSON.parse(JSON.stringify(model)); m.totals.surfaces = 999; expectInvalid('totals.surfaces uyuşmazlığı', m); }
// duplicate id
{ const m = JSON.parse(JSON.stringify(model)); m.sections.registeredSurfaces.push({ ...m.sections.registeredSurfaces[0] }); m.totals.surfaces++; expectInvalid('duplicate id/rota', m); }
// bilinmeyen status
{ const m = JSON.parse(JSON.stringify(model)); m.sections.registeredSurfaces[0].status = 'BOGUS'; expectInvalid('bilinmeyen status', m); }
// byStatus toplam uyuşmazlığı
{ const m = JSON.parse(JSON.stringify(model)); const k = Object.keys(m.totals.byStatus)[0]; m.totals.byStatus[k] = m.totals.byStatus[k] + 5; expectInvalid('byStatus toplam uyuşmazlığı', m); }
// sıralama bozuk (determinizm ihlali)
{ const m = JSON.parse(JSON.stringify(model)); m.sections.registeredSurfaces.reverse(); expectInvalid('sıralama deterministik değil', m); }
// secret/PII/mutlak-yol sızıntısı
if (scanForLeaks({ x: 'Authorization: Bearer abc.def' }).length === 0) fail('Bearer sızıntısı yakalanmadı.');
if (scanForLeaks({ x: 'user@example.com' }).length === 0) fail('E-posta sızıntısı yakalanmadı.');
if (scanForLeaks({ x: '/Users/someone/secret/' }).length === 0) fail('Mutlak yol sızıntısı yakalanmadı.');
if (scanForLeaks({ x: '/campaigns/outbound' }).length !== 0) fail('Temiz rota yanlışlıkla sızıntı sayıldı.');

// ───────────────────────── 3) POZİTİF ayrık kontroller ─────────────────────────
// status sözlüğü tam
for (const k of ['COVERED_CONTRACT', 'NO_COVERAGE_CONTRACT', 'BLOCKED', 'REDIRECT', 'DEPRECATED']) {
  if (!INVENTORY_STATUS[k]) fail(`INVENTORY_STATUS eksik: ${k}`);
}
// dinamik/blocked yüzeyler görünür ve reason-code'lu (bot-builder-detail örneği)
{
  const botDetail = model.sections.dynamicOrBlocked.find((r) => r.id === 'bot-builder-detail');
  if (!botDetail) fail('Dinamik yüzey (bot-builder-detail) dynamicOrBlocked bölümünde görünmüyor.');
  else if (!botDetail.blockedReason) fail('Dinamik yüzey reason-code taşımıyor.');
}
// FAZ 4'te eklenen yüzeyler gerçekten kayıtlı (regresyon guard)
for (const id of ['ai-voice', 'supervisor-coaching', 'voice-live', 'contacts-detail', 'campaigns-create', 'settings-billing-marketplace']) {
  if (!model.sections.registeredSurfaces.some((r) => r.id === id)) fail(`FAZ 4 yüzeyi envanterde yok: ${id}`);
}
// held candidate (campaigns PR-#42) enjekte edilince görünür + registry'ye SIZMAZ
{
  const held = buildInventoryModel({ surfaces: PRODUCT_SURFACES, dedicatedRoutes: coverage.dedicated, contractsBySurfaceId, reconcile: reconcileModel, heldCandidates: [{ route: '/campaigns/dnc', area: 'campaigns', reason: 'PR-only', evidenceRef: 'PR #42' }], generatedAt: null });
  if (held.totals.heldCandidates !== 1) fail('Held candidate sayılmadı.');
  if (held.sections.registeredSurfaces.some((r) => r.route === '/campaigns/dnc')) fail('Held candidate yanlışlıkla registry\'ye sızdı.');
  if (validateInventory(held).length !== 0) fail('Held candidate\'lı geçerli model reddedildi (yanlış-pozitif).');
}

// ───────────────────────────────── Sonuç ─────────────────────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} surface-inventory self-check ihlali.`);
  process.exit(1);
}
console.log(
  `Surface-inventory self-check geçti: ${model.totals.surfaces} yüzey · ` +
    `contract ${model.totals.coveredContract}/no-contract ${model.totals.noCoverageContract} · ` +
    `blocked ${model.totals.blocked}/dynamic ${model.totals.dynamic} · 0 observed-but-unregistered; ` +
    `tüm sentetik negatifler (bozuk sayım/sıralama/sızıntı) fail-closed reddedildi.`
);
