// @ts-check
/**
 * PRODUCTION READ-ONLY MANİFEST ÜRETİCİSİ (ADR-0015, FAZ 1).
 *
 * Disk'teki spec envanteri + sözleşme kaynaklarından deterministik manifesti
 * kurar, değişmezleri doğrular ve iki sanitize snapshot üretir:
 *   - docs/raporlar/READONLY-MANIFEST.json  (makine-okur)
 *   - docs/raporlar/READONLY-MANIFEST.md    (yönetici/insan özeti)
 *
 * Çıktı YALNIZ repo kaynaklarına bağlıdır (Date/SHA/rastgele yok) → aynı HEAD'de
 * iki koşum bit-bit aynı sonucu verir; drift `quality:readonly-manifest` ile
 * ve `report:readonly-manifest:check` git-diff kapısıyla yakalanır.
 *
 * Çalıştır:  node tools/generate-readonly-manifest.mjs   (npm run report:readonly-manifest)
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
import {
  buildManifest,
  buildSpecRouteIndex,
  validateManifest,
  serializeManifest,
  renderManifestMarkdown,
} from './readonly-manifest-lib.mjs';
import { walkSpecFiles } from './report-lib.mjs';
import { MUTATION_LIFECYCLE_EXCLUSIONS } from '../tests/contracts/mutation-lifecycle.js';
import { TESTED_PAGES } from '../tests/contracts/tested-pages.js';
import { REGISTERED_ROUTE_PATHS } from '../tests/contracts/registered-routes.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const testsDir = resolve(root, 'tests');
const JSON_OUT = resolve(root, 'docs/raporlar/READONLY-MANIFEST.json');
const MD_OUT = resolve(root, 'docs/raporlar/READONLY-MANIFEST.md');

/** Disk'ten repo-göreli, normalize edilmiş, sıralı spec listesi. */
export function diskSpecFiles() {
  return walkSpecFiles(testsDir)
    .map((abs) => relative(root, abs).split('\\').join('/'))
    .sort();
}

export function buildFromDisk() {
  const specFiles = diskSpecFiles();
  const routeIndex = buildSpecRouteIndex(TESTED_PAGES);
  const manifest = buildManifest({
    specFiles,
    lifecycle: MUTATION_LIFECYCLE_EXCLUSIONS,
    routeIndex,
  });
  validateManifest(manifest, {
    diskSpecFiles: specFiles,
    knownRoutes: REGISTERED_ROUTE_PATHS,
  });
  return manifest;
}

function main() {
  const manifest = buildFromDisk();
  const json = serializeManifest(manifest);
  const md = renderManifestMarkdown(manifest);
  writeFileSync(JSON_OUT, json, 'utf8');
  writeFileSync(MD_OUT, md, 'utf8');
  const c = manifest.counts;
  console.log(
    `Read-only manifest üretildi: ${c.totalSpecs} spec ` +
      `(${c.productionSafeReadOnly} production-safe, ${c.mutationExcluded} mutation + ` +
      `${c.externalCostExcluded} external-cost staging-only dışlandı).`
  );
  console.log(`  → ${relative(root, JSON_OUT)}`);
  console.log(`  → ${relative(root, MD_OUT)}`);
}

// Yalnız doğrudan çalıştırıldığında yaz (self-check import edip yeniden kurabilsin).
if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(`✗ Read-only manifest üretimi başarısız: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
