// @ts-check
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function mdCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function discoveryMarkdown(report) {
  const lines = [
    '# Vomenta otomatik keşif ön-taraması',
    '',
    `Üretim: ${report.generatedAt}`,
    '',
    '> Bu çıktı “keşif tamamlandı” iddiası değildir. Bilinmeyen kontrollere tıklamaz,',
    '> non-GET istekleri sunucuya ulaşmadan keser ve sayfaya özgü kapanış çalışmalarını listeler.',
    '',
    '## Özet',
    '',
    `- Ziyaret edilen rota: ${report.summary.visited}`,
    `- Test kaydı bulunmayan rota: ${report.summary.untestedRouteCount}`,
    `- Sert güvenlik/yükleme ihlali: ${report.summary.hardFailureCount}`,
    `- Limit nedeniyle kuyrukta kalan: ${report.summary.queuedRemaining}`,
    '',
    '## Önceki koşuya göre değişim radarı',
    '',
    `- Baseline: ${report.changes?.baselinePresent ? `var (${report.changes.baselineGeneratedAt})` : 'yok'}`,
    `- Yeni rota: ${report.changes?.addedRoutes.length || 0}`,
    `- Kaybolan rota: ${report.changes?.removedRoutes.length || 0}`,
    `- ARIA yapısı değişen rota: ${report.changes?.ariaChanged.length || 0}`,
    `- API endpoint envanteri değişen rota: ${report.changes?.networkChanged.length || 0}`,
    '',
    ...(report.changes?.ariaChanged.length
      ? report.changes.ariaChanged.map((change) => `- ARIA: \`${change.route}\``)
      : []),
    ...(report.changes?.networkChanged.length
      ? report.changes.networkChanged.map(
          (change) =>
            `- Ağ: \`${change.route}\` — +${change.added.length} / -${change.removed.length}`
        )
      : []),
    '',
    '## Kapsanmayan sayfa radarı',
    '',
    ...(report.coverage.untestedRoutes.length
      ? report.coverage.untestedRoutes.map((route) => `- \`${route}\``)
      : ['_(Crawler’ın ulaştığı tüm rotalar tested-pages.js kaydında.)_']),
    '',
    '## Sert ihlaller',
    '',
    ...(report.hardFailures.length
      ? report.hardFailures.map((failure) => `- \`${failure.type}\`: ${mdCell(JSON.stringify(failure))}`)
      : ['_(yok)_']),
    '',
  ];

  for (const page of report.pages) {
    lines.push(
      `## ${page.route}`,
      '',
      `- Son rota: \`${page.finalPath}\``,
      `- tested-pages.js: ${page.coverage.registered ? `Kayıtlı (${page.coverage.registeredEntryIds.join(', ')})` : 'KAYITSIZ'}`,
      `- Hata olayı: ${page.errors.length}`,
      `- Yavaş istek: ${page.network.slowRequests.length}`,
      `- Yatay taşma: ${page.overflow.horizontal ? 'VAR' : 'yok'}`,
      `- Ciddi/kritik a11y bulgusu: ${page.accessibility.length}`,
      `- iframe: ${page.frames.length - 1}; shadow root: ${page.shadowRootCount}`,
      '',
      '### Görünür kontrol envanteri (maskelenmiş role + name)',
      '',
      '| Role | Name | expanded | pressed | selected |',
      '|---|---|---|---|---|',
      ...page.controls.slice(0, 80).map((control) =>
        `| ${mdCell(control.role)} | ${mdCell(control.name)} | ${mdCell(control.expanded)} | ${mdCell(control.pressed)} | ${mdCell(control.selected)} |`
      ),
      '',
      '### Keşif kapanışına hazırlık matrisi',
      '',
      '| Durum | Ön-tarama sonucu | Gerekçe |',
      '|---|---|---|',
      ...page.stateMatrix.map((item) =>
        `| ${mdCell(item.state)} | ${mdCell(item.status)} | ${mdCell(item.reason)} |`
      ),
      ''
    );
  }
  return `${lines.join('\n')}\n`;
}

/**
 * @param {any} report
 * @param {string} outputDirectory
 */
export async function writeDiscoveryReports(report, outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
  const jsonPath = path.join(outputDirectory, 'discovery-report.json');
  const markdownPath = path.join(outputDirectory, 'discovery-report.md');
  await Promise.all([
    writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
    writeFile(markdownPath, discoveryMarkdown(report), 'utf8'),
  ]);
  return { jsonPath, markdownPath };
}
