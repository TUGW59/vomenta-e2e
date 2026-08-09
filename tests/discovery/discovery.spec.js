// @ts-check
import { test, expect } from '../fixtures/test.js';
import { environment } from '../../config/environment.js';
import { crawlApplication } from './crawler.js';
import { writeDiscoveryReports } from './reporters.js';
import {
  compareDiscoveryBaseline,
  evaluateDriftPolicy,
  loadDiscoveryBaseline,
  writeDiscoveryBaseline,
} from './baseline.js';

test.describe.configure({ mode: 'serial', retries: 0 });
// Seed rota evreni (~66) her koşumda tam gezilir + rota başına içerik-hazır
// beklemesi (≤6s) eklendi → süre bütçesi yükseltildi (CI job sınırı 30dk altında).
// Gerçek süre Faz 2'de canlı uygulamaya karşı ölçülüp ince ayarlanır.
test.setTimeout(900_000);

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

  // SÜRÜM-DRIFT KAPISI (ADR-0033): Bu kontrol canlı, aktif geliştirilen prod'a
  // karşı koşan bir MONITORING sinyalidir (per-PR birim doğrulaması değil — bu
  // yüzden pr-impact seçicisi discovery'yi PR lane'de koşmaz, nightly'ye erteler).
  // Kapı YALNIZ kararlı regresyon sinyalinde kırmızı olur: GERÇEKTEN denenip
  // ulaşılamayan (removed) rota. Beklenen canlı-prod drift'i (ARIA yapısı, endpoint
  // envanteri, eklenen/limit-dışı rotalar) advisory annotation'dır — kapıyı
  // kırmızıya çevirmez. Baseline'ı GÜNCELLERKEN kapı uygulanmaz.
  const drift = evaluateDriftPolicy(report.changes);
  if (!environment.discovery.updateBaseline) {
    if (drift.info.length) {
      testInfo.annotations.push({ type: 'discovery-drift-info', description: drift.info.join('; ') });
    }
    expect(
      drift.failures,
      `Discovery drift: baseline'a göre kaldırılan rota / değişen yapı / kaybolan endpoint.\n${drift.failures.join('\n')}`
    ).toEqual([]);
  }

  // Baseline yalnızca koşum güvenliği doğrulandıktan (hardFailures boş) SONRA
  // güncellenir; böylece bozuk bir keşif sonucu referans olarak yazılmaz.
  if (environment.discovery.updateBaseline) {
    await writeDiscoveryBaseline(report);
  }
});
