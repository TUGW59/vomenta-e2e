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
 * Politika (ADR-0033 — canlı-prod monitoring drift'ine karşı stabilizasyon):
 * Bu kontrol CANLI, aktif geliştirilen prod'a karşı koşar. ARIA yapısı ve API
 * endpoint envanteri prod'da SÜREKLİ ve BEKLENEN biçimde değişir (feature flag,
 * lazy-load, A/B, günlük deploy). Bunları BLOK saymak, gerçek bir regresyon
 * olmadan kapıyı kronik kırmızıya boyar (P1-7 flakiness). Bu yüzden:
 *  - removedRoutes  → FAIL: baseline'da parmak-izi olan bir rota GERÇEKTEN denenip
 *    (navigate edilip) bulunamadı → anlamlı, kararlı regresyon sinyali. (F-023:
 *    yalnız `attemptedRoutes` kümesindeki rotalar; limit yüzünden ziyaret
 *    edilmeyenler `unvisitedBaselineRoutes` olarak BİLGİdir — bkz. compare.)
 *  - ariaStructure değişimi → BİLGİ (advisory): canlı-prod-beklenen yapı drift'i.
 *  - endpoint eklendi/kaldırıldı → BİLGİ (advisory): canlı-prod-beklenen API drift'i.
 *  - addedRoutes → BİLGİ: yeni sayfa tek başına bug değildir.
 *  - unvisitedBaselineRoutes → BİLGİ: limit/kapsam boşluğu (F-023), regresyon değil.
 *  - baseline yok → OK (bootstrap; ilk üretim update-baseline ile yapılır).
 *
 * NOT: Gerçek güvenlik regresyonu (oturum/origin kaybı, document 5xx, engellenen
 * non-GET) drift değil `report.hardFailures`'tır ve discovery.spec içinde HER
 * HÂLDE ayrı ve KOŞULSUZ BLOK olarak assert edilir — advisory yapılmaz.
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
    failures.push(`removed-route: ${route} (baseline'da vardı, denendi ve ulaşılamadı)`);
  }
  for (const route of changes.unvisitedBaselineRoutes || []) {
    info.push(`unvisited-baseline-route: ${route} (limit/kapsam — ziyaret edilmedi, F-023)`);
  }
  for (const change of changes.ariaChanged || []) {
    info.push(`aria-changed: ${change.route}`);
  }
  for (const change of changes.networkChanged || []) {
    if (change.removed?.length) {
      info.push(`endpoint-removed: ${change.route} → ${change.removed.join(', ')}`);
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
      unvisitedBaselineRoutes: [],
      ariaChanged: [],
      networkChanged: [],
    };
  }

  const current = makeDiscoveryBaseline(report);
  const oldRoutes = new Set(Object.keys(baseline.routes || {}));
  const newRoutes = new Set(Object.keys(current.routes));
  const shared = [...newRoutes].filter((route) => oldRoutes.has(route)).sort();

  // F-023: baseline'da olup bu koşumun fingerprint'inde OLMAYAN rotaları ikiye ayır.
  // `attemptedRoutes` GERÇEKTEN navigate edilen rotalardır (crawler her zaman üretir).
  // Bu bilgi YOKSA (eski rapor şeması) FAIL-CLOSED davran: eksik rotaların hepsini
  // "removed" say (regresyonu sessizce yeşile alma) — F-023 ayrımı yalnız attempted
  // bilgisi mevcutken uygulanır.
  const attempted = Array.isArray(report.attemptedRoutes)
    ? new Set(report.attemptedRoutes)
    : null;
  const missing = [...oldRoutes].filter((route) => !newRoutes.has(route)).sort();
  // Denenip bulunamayan → GERÇEK removed (regresyon sinyali).
  const removedRoutes = attempted
    ? missing.filter((route) => attempted.has(route))
    : missing;
  // Hiç denenmeyen (maxPages truncation / kapsam boşluğu) → BİLGİ, removed DEĞİL.
  const unvisitedBaselineRoutes = attempted
    ? missing.filter((route) => !attempted.has(route))
    : [];

  return {
    baselinePresent: true,
    baselineGeneratedAt: baseline.generatedAt,
    addedRoutes: [...newRoutes].filter((route) => !oldRoutes.has(route)).sort(),
    removedRoutes,
    unvisitedBaselineRoutes,
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
