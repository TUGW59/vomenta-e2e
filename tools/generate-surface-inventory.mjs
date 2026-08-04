// @ts-check
/**
 * SURFACE-INVENTORY ÜRETİCİ (WP-SURFACE-RECONCILE / FAZ 4 / ADR-0021).
 *
 * Kanonik `PRODUCT_SURFACES` + kapsam sözleşmeleri + cross-source completeness uzlaştırmasını
 * TEK deterministik envanter modeline dönüştürür ve iki dosyaya yazar:
 *   - docs/raporlar/SURFACE-INVENTORY.json  (makine-okur)
 *   - docs/SURFACE-INVENTORY.md             (insan-okur)
 *
 * Girdi TAMAMEN STATİK repo kaynaklarıdır (registry + tested-pages + committed runtime/discovery)
 * → aynı ağaç iki kez BIT-IDENTICAL çıktı verir. generatedAt YAZILMAZ (null): drift kapısı
 * (report:surface-inventory:check) yalnız GERÇEK içerik sapmasını yakalar.
 *
 * Çalıştır:  node tools/generate-surface-inventory.mjs   (npm run report:surface-inventory)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { PRODUCT_SURFACES } from '../tests/contracts/product-surfaces.js';
import { REGISTERED_ROUTE_PATHS } from '../tests/contracts/registered-routes.js';
import { MAIN_NAVIGATION } from '../tests/contracts/navigation.js';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';
import { TESTED_PAGES } from '../tests/contracts/tested-pages.js';
import {
  reconcile,
  classifyCoverageContracts,
  buildPrImpactSurfaceMap,
} from './surface-completeness-lib.mjs';
import { buildInventoryModel, renderInventoryJson, renderInventoryMd, validateInventory } from './surface-inventory-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readJson(rel) {
  try { return JSON.parse(readFileSync(resolve(root, rel), 'utf8')); } catch { return null; }
}

// ── Cross-source uzlaştırma (completeness ile AYNI gerçek kaynak seti) ──────────────
const runtime = readJson('docs/raporlar/TEST-SONUCLARI.json') || {};
const discovery = readJson('tests/contracts/discovery-baseline.json') || { routes: {} };
const coverage = classifyCoverageContracts(TESTED_PAGES);
const prImpact = buildPrImpactSurfaceMap(TESTED_PAGES);
const runtimeRoutes = [
  ...((runtime.pages || []).map((p) => p.route)),
  ...((runtime.unmappedTests || []).map((u) => u.routeMarker).filter(Boolean)),
];
const sources = [
  { kind: 'navigation', routes: MAIN_NAVIGATION.map((n) => n.path) },
  { kind: 'coverage-contract', routes: coverage.dedicated },
  { kind: 'coverage-baseline', routes: coverage.baseline },
  { kind: 'route-marker', routes: [...REGISTERED_ROUTE_PATHS] },
  { kind: 'known-bug', routes: KNOWN_BUGS.map((b) => b.route).filter(Boolean) },
  { kind: 'runtime', routes: runtimeRoutes },
  { kind: 'discovery', routes: Object.keys(discovery.routes || {}) },
  { kind: 'pr-impact', routes: prImpact.routes },
];
const reconcileModel = reconcile({ surfaces: PRODUCT_SURFACES, sources, generatedAt: null });

// ── surfaceId → dedicated (main-navigation OLMAYAN) sözleşme id'leri ────────────────
/** @type {Record<string,string[]>} */
const contractsBySurfaceId = {};
for (const p of TESTED_PAGES) {
  if (p.routeLevelBaseline) continue; // main-navigation dedicated SAYILMAZ
  for (const sid of p.surfaceIds || []) {
    (contractsBySurfaceId[sid] ||= []).push(p.id);
  }
}

// ── Bilinçli EKLENMEYEN adaylar (HANDOFF FAZ 4 §6/§task-6 — kör eklenmez) ───────────
// PR #42'ye özgü Campaigns alt rotaları: güncel main'de HİÇBİR kaynakta gözlenmiyor
// (spec/page-object/discovery/known-bug = 0). Kanıt sadece açık PR #42 kodunda → HELD.
const heldCandidates = [
  { route: '/campaigns/sender-ids', area: 'campaigns', reason: 'PR-only (#42); güncel main\'de kanıt yok (0 spec/page-object/discovery/known-bug)', evidenceRef: 'PR #42' },
  { route: '/campaigns/dnc', area: 'campaigns', reason: 'PR-only (#42); güncel main\'de kanıt yok', evidenceRef: 'PR #42' },
  { route: '/campaigns/templates', area: 'campaigns', reason: 'PR-only (#42); güncel main\'de kanıt yok', evidenceRef: 'PR #42' },
];

const model = buildInventoryModel({
  surfaces: PRODUCT_SURFACES,
  dedicatedRoutes: coverage.dedicated,
  contractsBySurfaceId,
  reconcile: reconcileModel,
  heldCandidates,
  generatedAt: null,
});

const errs = validateInventory(model);
if (errs.length) {
  console.error('SURFACE-INVENTORY modeli geçersiz:');
  for (const e of errs) console.error('  ✗ ' + e);
  process.exit(1);
}

mkdirSync(resolve(root, 'docs/raporlar'), { recursive: true });
const jsonPath = resolve(root, 'docs/raporlar/SURFACE-INVENTORY.json');
const mdPath = resolve(root, 'docs/SURFACE-INVENTORY.md');
writeFileSync(jsonPath, renderInventoryJson(model));
writeFileSync(mdPath, renderInventoryMd(model));

console.log(
  `✓ Yüzey envanteri üretildi: ${model.totals.surfaces} yüzey · ` +
    `contract ${model.totals.coveredContract}/no-contract ${model.totals.noCoverageContract} · ` +
    `blocked ${model.totals.blocked} · dynamic ${model.totals.dynamic} · ` +
    `unregistered ${model.totals.observedButUnregistered} · held ${model.totals.heldCandidates}\n` +
    `  → ${jsonPath}\n  → ${mdPath}`
);
