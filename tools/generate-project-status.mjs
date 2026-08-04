#!/usr/bin/env node
// @ts-check
/**
 * WP-SURFACE-UNIFIED (FAZ 5) — PROJE DURUMU ÜRETİCİ (CLI / ADR-0022).
 *
 * `tools/unified-report-lib.mjs` saf birleşim motorunu FAZ 4'ün committed model
 * JSON'larıyla (SURFACE-INVENTORY + SURFACE-DEPTH) besleyip iki deterministik çıktı üretir:
 *   docs/raporlar/PROJECT-STATUS.json  (makine-okur)
 *   docs/PROJECT-STATUS.md             (insan-okur, drift kapısı)
 *
 * Girdi TAMAMEN STATİK committed model JSON'larıdır (playwright/prod KOŞUM YOK) → aynı ağaç
 * iki kez BIT-IDENTICAL çıktı verir. `generatedAt` YAZILMAZ (null): drift kapısı
 * (report:project-status:check) yalnız GERÇEK içerik sapmasını yakalar. Runtime provenance
 * (commit/ortam/tarayıcı/zaman) `source` alanında SURFACE-DEPTH'ten devralınır.
 *
 * Çalıştır:  node tools/generate-project-status.mjs   (npm run report:project-status)
 * Bayraklar: --inventory <path> --depth <path> --out-dir <dir> --check
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import {
  buildUnifiedModel,
  validateUnifiedModel,
  renderProjectStatusJson,
  renderProjectStatusMd,
} from './unified-report-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function arg(name, def = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : def;
}
const CHECK_ONLY = process.argv.includes('--check');
const invPath = resolve(root, arg('--inventory', 'docs/raporlar/SURFACE-INVENTORY.json'));
const depthPath = resolve(root, arg('--depth', 'docs/raporlar/SURFACE-DEPTH.json'));
const outDir = resolve(root, arg('--out-dir', '.'));

function readModel(path, label) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    console.error(`✗ ${label} modeli yok: ${path} (önce: npm run report:all).`);
    process.exit(1);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`✗ ${label} modeli bozuk JSON: ${path}\n  ${e.message}`);
    process.exit(1);
  }
}

const inventoryModel = readModel(invPath, 'Envanter (SURFACE-INVENTORY)');
const depthModel = readModel(depthPath, 'Kapsam derinliği (SURFACE-DEPTH)');

const model = buildUnifiedModel({ inventoryModel, depthModel, generatedAt: null });

const errs = validateUnifiedModel(model);
if (errs.length) {
  console.error('PROJECT-STATUS birleşik modeli geçersiz (fail-closed):');
  for (const e of errs) console.error('  ✗ ' + e);
  process.exit(1);
}

const jsonOut = renderProjectStatusJson(model);
const mdOut = renderProjectStatusMd(model);

const jsonPath = join(outDir, 'docs/raporlar/PROJECT-STATUS.json');
const mdPath = join(outDir, 'docs/PROJECT-STATUS.md');

if (CHECK_ONLY) {
  console.log(`✓ project-status invariant + uzlaştırma kapısı geçti (${model.totals.surfaces} yüzey). Yazılmadı (--check).`);
  process.exit(0);
}

mkdirSync(dirname(jsonPath), { recursive: true });
mkdirSync(dirname(mdPath), { recursive: true });
writeFileSync(jsonPath, jsonOut);
writeFileSync(mdPath, mdOut);

const t = model.totals;
console.log(
  `✓ Proje durumu üretildi: ${t.surfaces} yüzey · ` +
    `deep ${t.l2Deep} · style-unverified ${t.l2Style} · style-gap ${t.l1StyleGap} · ` +
    `no-contract ${t.noContract} · not-run ${t.notRun} · fail ${t.fail} · blocked ${t.blocked}\n` +
    `  → ${jsonPath}\n  → ${mdPath}`
);
