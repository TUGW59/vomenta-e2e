#!/usr/bin/env node
// @ts-check
/**
 * WP-SURFACE (FAZ 4) — KAPSAM DERİNLİĞİ ÜRETECİ (CLI).
 *
 * `tools/surface-depth-lib.mjs` saf motorunu gerçek envanter + runtime raporu +
 * Playwright etiket listesiyle besleyip iki deterministik çıktı üretir:
 *   docs/raporlar/SURFACE-DEPTH.json   (makine-okur)
 *   docs/SURFACE-DEPTH-MATRIX.md       (repo source-of-truth, drift kapısı)
 *
 * Etiketler `npx playwright test --list --reporter=json` ile alınır (KOŞUM YOK →
 * production'a trafik yok; style-coverage.mjs ile aynı prod-safe desen). Prod'da
 * @mutation testleri listeden düşmesin diye ALLOW_MUTATING_TESTS=true YALNIZ --list'e
 * geçilir. Determinizm/self-check için enjeksiyon bayrakları:
 *   --runtime <path>    runtime raporu (varsayılan docs/raporlar/TEST-SONUCLARI.json)
 *   --list-json <path>  önceden yakalanmış --list JSON'u (varsayılan: canlı --list)
 *   --out-dir <dir>     çıktı kökü (varsayılan repo kökü)
 *   --check             yazmadan doğrula (invariant + leak); diff'i çağıran yapar
 *
 * Çalıştır:  node tools/generate-surface-depth.mjs   (npm run report:surface)
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { TESTED_PAGES } from '../tests/contracts/tested-pages.js';
import { REGISTERED_ROUTES } from '../tests/contracts/registered-routes.js';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';
import {
  buildTagIndex,
  buildSurfaceModel,
  validateSurfaceInvariants,
  renderSurfaceJson,
  renderSurfaceMarkdown,
  scanOutputLeaks,
} from './surface-depth-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function arg(name, def = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : def;
}
const CHECK_ONLY = process.argv.includes('--check');
const runtimePath = resolve(root, arg('--runtime', 'docs/raporlar/TEST-SONUCLARI.json'));
const listJsonPath = arg('--list-json', null);
const outDir = resolve(root, arg('--out-dir', '.'));

// 1) Runtime raporu (L1 gerçeği).
if (!existsSync(runtimePath)) {
  console.error(`✗ Runtime raporu yok: ${runtimePath} (önce: npm run report:runtime).`);
  process.exit(1);
}
const runtimeReport = JSON.parse(readFileSync(runtimePath, 'utf8'));

// 2) Playwright etiket listesi (KOŞUM YOK — yalnız --list).
let listReport;
if (listJsonPath) {
  listReport = JSON.parse(readFileSync(resolve(root, listJsonPath), 'utf8'));
} else {
  const raw = execSync('npx playwright test --list --reporter=json', {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'ignore'],
    env: { ...process.env, ALLOW_MUTATING_TESTS: 'true' }, // yalnız listeleme; koşum değil
  });
  listReport = JSON.parse(raw);
}
const { tagsByFile, tagsByRoute } = buildTagIndex(listReport);

// 3) Model kur + invariant kapısı. generatedAt = runtime raporunun zamanı (deterministik).
const model = buildSurfaceModel({
  registeredRoutes: REGISTERED_ROUTES,
  testedPages: TESTED_PAGES,
  knownBugs: KNOWN_BUGS,
  runtimeReport,
  tagsByRoute,
  tagsByFile,
  generatedAt: runtimeReport.generatedAt || null,
});
validateSurfaceInvariants(model);

// 4) Render + sızıntı kapısı.
const jsonOut = renderSurfaceJson(model);
const mdOut = renderSurfaceMarkdown(model);
const leaks = [...scanOutputLeaks(jsonOut), ...scanOutputLeaks(mdOut)];
if (leaks.length) {
  console.error(`✗ Çıktıda sızıntı: ${[...new Set(leaks)].join(', ')}`);
  process.exit(1);
}

const jsonPath = join(outDir, 'docs/raporlar/SURFACE-DEPTH.json');
const mdPath = join(outDir, 'docs/SURFACE-DEPTH-MATRIX.md');

if (CHECK_ONLY) {
  console.log(`✓ surface-depth invariant + leak kapısı geçti (${model.pages.length} rota). Yazılmadı (--check).`);
  process.exit(0);
}

mkdirSync(dirname(jsonPath), { recursive: true });
mkdirSync(dirname(mdPath), { recursive: true });
writeFileSync(jsonPath, jsonOut);
writeFileSync(mdPath, mdOut);

const t = model.totals;
console.log(
  `✓ Kapsam derinliği üretildi: ${model.pages.length} rota · ` +
  `L1 proven ${t.l1Proven} · L2 complete ${t.l2Complete}/partial ${t.l2Partial}/not-covered ${t.l2NotCovered}\n` +
  `  → ${jsonPath}\n  → ${mdPath}`
);
