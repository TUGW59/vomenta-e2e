// @ts-check
/**
 * WP-R2 — Rapor MD'lerini HTML + PDF'e render eder (ARTIFACT — Git'e commit EDİLMEZ).
 * Kaynak (repo): docs/raporlar/*.md → çıktı (gitignored): docs/raporlar/*.html + *.pdf
 * PDF: Playwright chromium `page.pdf()` (ek bağımlılık yok).
 *
 * Çalıştır: npm run report:pdf   (önce npm run report:build)
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mdToHtml, htmlDoc } from './report-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'docs/raporlar');

const REPORTS = [
  { md: 'BULGULAR.md', title: 'Vomenta — Bulgu Raporu' },
  { md: 'YAPILAN-TESTLER.md', title: 'Vomenta — Yapılan Testler' },
  { md: 'YAPILMAYAN-TESTLER.md', title: 'Vomenta — Yapılmayan Testler' },
];

const missing = REPORTS.filter((r) => !existsSync(resolve(dir, r.md)));
if (missing.length) {
  console.error(`Eksik MD kaynağı: ${missing.map((m) => m.md).join(', ')} — önce: npm run report:build`);
  process.exit(1);
}

// 1) MD → HTML (gitignored)
for (const r of REPORTS) {
  const md = readFileSync(resolve(dir, r.md), 'utf8');
  writeFileSync(resolve(dir, r.md.replace(/\.md$/, '.html')), htmlDoc(r.title, mdToHtml(md)));
}

// 2) HTML → PDF (gitignored)
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const r of REPORTS) {
    const htmlPath = resolve(dir, r.md.replace(/\.md$/, '.html'));
    const pdfPath = resolve(dir, r.md.replace(/\.md$/, '.pdf'));
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' } });
  }
} finally {
  await browser.close();
}
console.log(`Rapor HTML+PDF üretildi (artifact, commit edilmez): ${REPORTS.map((r) => r.md.replace(/\.md$/, '.{html,pdf}')).join(', ')}`);
