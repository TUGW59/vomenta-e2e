// @ts-check
import { MAIN_NAVIGATION } from '../contracts/navigation.js';
import { TESTED_PAGES } from '../contracts/tested-pages.js';
import { probePage } from './probes.js';
import { observeDiscovery } from './observer.js';
import { installReadOnlyGuard, safeInternalPath } from './safety.js';

function registeredRoutes() {
  return new Set(TESTED_PAGES.flatMap((entry) => entry.routes));
}

/**
 * Aynı-origin rotaları BFS ile gezer. Hiçbir UI kontrolüne tıklamaz ve tüm
 * non-GET istekleri browser route katmanında keser.
 * @param {import('@playwright/test').Page} page
 * @param {{ baseURL:string, maxPages?:number, slowThresholdMs?:number }} options
 */
export async function crawlApplication(
  page,
  { baseURL, maxPages = 40, slowThresholdMs = 2_000 }
) {
  const guard = await installReadOnlyGuard(page);
  const observer = observeDiscovery(page);
  const registered = registeredRoutes();
  const queue = [
    '/',
    ...MAIN_NAVIGATION.map(({ path }) => path),
    ...registered,
  ];
  const queued = new Set(queue);
  const visited = new Set();
  const pages = [];
  const hardFailures = [];

  try {
    while (queue.length > 0 && pages.length < maxPages) {
      const route = queue.shift();
      if (!route || visited.has(route)) continue;
      visited.add(route);
      const checkpoint = observer.checkpoint();
      let response = null;
      let navigationError = null;

      try {
        response = await page.goto(route, { waitUntil: 'commit' });
        await page.waitForLoadState('domcontentloaded');
      } catch (error) {
        navigationError = error instanceof Error ? error.name : 'NavigationError';
      }

      const finalPath = safeInternalPath(page.url(), baseURL);
      const lostSession =
        !finalPath ||
        /^\/(?:login|sign-in|signin|auth)(?:\/|$)/i.test(finalPath);
      if (navigationError) {
        hardFailures.push({ route, type: 'navigation-failed', detail: navigationError });
      }
      if (response && response.status() >= 500) {
        hardFailures.push({ route, type: 'document-server-error', status: response.status() });
      }
      if (lostSession) {
        hardFailures.push({ route, type: 'session-or-origin-lost', finalPath: finalPath || '<external>' });
        continue;
      }

      const result = await probePage(page, {
        baseURL,
        route,
        events: observer.since(checkpoint),
        slowThresholdMs,
      });
      result.coverage = {
        registered: registered.has(route),
        registeredEntryIds: TESTED_PAGES
          .filter((entry) => entry.routes.includes(route))
          .map((entry) => entry.id),
      };
      pages.push(result);

      for (const path of result.discoveredPaths) {
        if (!visited.has(path) && !queued.has(path)) {
          queue.push(path);
          queued.add(path);
        }
      }
    }
  } finally {
    observer.stop();
    await guard.stop();
  }

  if (guard.blocked.length > 0) {
    hardFailures.push({
      type: 'non-read-request-blocked',
      count: guard.blocked.length,
      requests: guard.blocked.slice(0, 25),
    });
  }

  const untestedRoutes = pages
    .filter((entry) => !entry.coverage.registered)
    .map((entry) => entry.route)
    .sort();
  const registeredNotReached = [...registered]
    .filter((route) => !visited.has(route))
    .sort();

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    policy: {
      mode: 'read-only-report',
      mutationMethods: 'blocked before network',
      rawHar: false,
      rawAriaSnapshot: false,
      completionClaim: false,
    },
    limits: { maxPages, slowThresholdMs },
    summary: {
      visited: pages.length,
      queuedRemaining: queue.length,
      untestedRouteCount: untestedRoutes.length,
      hardFailureCount: hardFailures.length,
    },
    coverage: { untestedRoutes, registeredNotReached },
    hardFailures,
    pages,
  };
}
