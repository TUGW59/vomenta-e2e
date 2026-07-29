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
