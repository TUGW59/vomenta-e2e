// @ts-check
import { test, expect } from '../fixtures/test.js';
import { environment } from '../../config/environment.js';
import { crawlApplication } from './crawler.js';
import { writeDiscoveryReports } from './reporters.js';
import {
  compareDiscoveryBaseline,
  loadDiscoveryBaseline,
  writeDiscoveryBaseline,
} from './baseline.js';

test.describe.configure({ mode: 'serial', retries: 0 });
test.setTimeout(420_000);

test('salt-okunur uygulama keşfi rapor ve kapsam radarı üretir', async ({
  page,
}, testInfo) => {
  const report = await crawlApplication(page, {
    baseURL: environment.baseURL,
    maxPages: environment.discovery.maxPages,
    slowThresholdMs: environment.discovery.slowThresholdMs,
  });
  report.changes = compareDiscoveryBaseline(
    report,
    await loadDiscoveryBaseline()
  );
  const outputDirectory = testInfo.outputPath('discovery');
  const paths = await writeDiscoveryReports(report, outputDirectory);

  await Promise.all([
    testInfo.attach('discovery-report.json', {
      path: paths.jsonPath,
      contentType: 'application/json',
    }),
    testInfo.attach('discovery-report.md', {
      path: paths.markdownPath,
      contentType: 'text/markdown',
    }),
  ]);

  expect(
    report.hardFailures,
    'Keşif sırasında oturum/origin kaybı, document 5xx veya engellenen non-GET istek olmamalı'
  ).toEqual([]);

  // Baseline yalnızca koşum güvenliği doğrulandıktan (hardFailures boş) SONRA
  // güncellenir; böylece bozuk bir keşif sonucu referans olarak yazılmaz.
  if (environment.discovery.updateBaseline) {
    await writeDiscoveryBaseline(report);
  }
});
