// @ts-check
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { canonicalAriaStructure } from './probes.js';

export const DISCOVERY_BASELINE_PATH = new URL(
  '../contracts/discovery-baseline.json',
  import.meta.url
);

function hash(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function endpointKeys(page) {
  return [...new Set(page.network.endpoints || [])].sort();
}

export function makeDiscoveryBaseline(report) {
  return {
    schemaVersion: 1,
    generatedAt: report.generatedAt,
    routes: Object.fromEntries(
      [...report.pages]
        .sort((a, b) => a.route.localeCompare(b.route))
        .map((page) => [
          page.route,
          {
            ariaStructureHash: hash(canonicalAriaStructure(page.ariaStructure)),
            endpoints: endpointKeys(page),
          },
        ])
    ),
  };
}

export async function loadDiscoveryBaseline() {
  try {
    return JSON.parse(await readFile(DISCOVERY_BASELINE_PATH, 'utf8'));
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function writeDiscoveryBaseline(report) {
  const baseline = makeDiscoveryBaseline(report);
  await writeFile(
    DISCOVERY_BASELINE_PATH,
    `${JSON.stringify(baseline, null, 2)}\n`,
    'utf8'
  );
  return baseline;
}

/**
 * Baseline farkını (compareDiscoveryBaseline çıktısı) sürüm-drift politikasına
 * göre PASS/FAIL kararına indirger. Saf fonksiyon (tarayıcı gerektirmez) → offline
 * birim-test edilebilir ve discovery.spec içinde tek assertion olarak kullanılır.
 *
 * Politika (keşif kuralı hizası):
 *  - removedRoutes  → FAIL: baseline'da parmak-izi olan bir rota artık ulaşılamıyor
 *    (regresyon ya da rota drift'i; sessizce yeşil kalmamalı).
 *  - ariaStructure değişimi → FAIL: sayfanın yapısı değişti.
 *  - kaldırılan endpoint → FAIL: bir API yüzeyi kayboldu.
 *  - addedRoutes / eklenen endpoint → BİLGİ (yeni sayfa/endpoint tek başına bug
 *    değildir; envantere girer, kapıyı kırmızıya çevirmez).
 *  - baseline yok → OK (bootstrap; ilk üretim update-baseline ile yapılır).
 * @param {ReturnType<typeof compareDiscoveryBaseline>} changes
 * @returns {{ ok:boolean, failures:string[], info:string[] }}
 */
export function evaluateDriftPolicy(changes) {
  const failures = [];
  const info = [];

  if (!changes || changes.baselinePresent === false) {
    info.push('baseline yok — bootstrap; drift kapısı update-baseline sonrası etkin.');
    return { ok: true, failures, info };
  }

  for (const route of changes.removedRoutes || []) {
    failures.push(`removed-route: ${route} (baseline'da vardı, bu koşumda ulaşılamadı)`);
  }
  for (const change of changes.ariaChanged || []) {
    failures.push(`aria-changed: ${change.route}`);
  }
  for (const change of changes.networkChanged || []) {
    if (change.removed?.length) {
      failures.push(`endpoint-removed: ${change.route} → ${change.removed.join(', ')}`);
    }
    if (change.added?.length) {
      info.push(`endpoint-added: ${change.route} → ${change.added.join(', ')}`);
    }
  }
  for (const route of changes.addedRoutes || []) {
    info.push(`added-route: ${route}`);
  }

  return { ok: failures.length === 0, failures, info };
}

export function compareDiscoveryBaseline(report, baseline) {
  if (!baseline) {
    return {
      baselinePresent: false,
      addedRoutes: report.pages.map((page) => page.route).sort(),
      removedRoutes: [],
      ariaChanged: [],
      networkChanged: [],
    };
  }

  const current = makeDiscoveryBaseline(report);
  const oldRoutes = new Set(Object.keys(baseline.routes || {}));
  const newRoutes = new Set(Object.keys(current.routes));
  const shared = [...newRoutes].filter((route) => oldRoutes.has(route)).sort();

  return {
    baselinePresent: true,
    baselineGeneratedAt: baseline.generatedAt,
    addedRoutes: [...newRoutes].filter((route) => !oldRoutes.has(route)).sort(),
    removedRoutes: [...oldRoutes].filter((route) => !newRoutes.has(route)).sort(),
    ariaChanged: shared
      .filter(
        (route) =>
          baseline.routes[route].ariaStructureHash !==
          current.routes[route].ariaStructureHash
      )
      .map((route) => ({
        route,
        before: baseline.routes[route].ariaStructureHash,
        after: current.routes[route].ariaStructureHash,
      })),
    networkChanged: shared
      .map((route) => {
        const before = new Set(baseline.routes[route].endpoints || []);
        const after = new Set(current.routes[route].endpoints || []);
        return {
          route,
          added: [...after].filter((endpoint) => !before.has(endpoint)).sort(),
          removed: [...before].filter((endpoint) => !after.has(endpoint)).sort(),
        };
      })
      .filter((change) => change.added.length || change.removed.length),
  };
}
