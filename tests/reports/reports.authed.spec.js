// @ts-check
import { test, expect } from '../fixtures/test.js';
import { gotoApp, knownBugGuard, waitForUiToSettle } from '../helpers.js';

/**
 * Reports sayfası testleri (girişli, salt-okunur).
 * Rapor OLUŞTURMA / dışa aktarma (Export All vb.) tıklanmaz — sadece görünürlük.
 */

const TABS = ['Report Types', 'Recent', 'AI Insights'];
const ACTIONS = ['Export All', 'Custom Report', 'New Dashboard', 'Schedule a Report'];

// Sekme seçilince panelinin gerçekten o içeriği render ettiğini doğrulayan imzalar
// (canlı gözlem). Bkz. AGENTS.md "İçerik ve değer derinliği standardı".
const TAB_SIGNATURES = {
  'Report Types': 'Call Reports',
  Recent: 'No recently viewed reports',
  'AI Insights': 'Analyze with AI',
};

async function openReports(page) {
  await gotoApp(page, '/reports');
  await expect(
    page.getByRole('heading', { name: 'Reports', exact: true })
  ).toBeVisible({ timeout: 30000 });
}

test.describe('Vomenta - Reports', () => {
  test('sayfa başlığı ve tarih aralığı seçici görünüyor', async ({ page }) => {
    await openReports(page);
    // Tarih aralığı butonu "YYYY-MM-DD → YYYY-MM-DD" biçiminde.
    await expect(
      page.getByRole('button', { name: /\d{4}-\d{2}-\d{2}.*\d{4}-\d{2}-\d{2}/ })
    ).toBeVisible();
  });

  test('sekmeler tıklanınca seçili oluyor VE paneli o içeriği gösteriyor', async ({ page }) => {
    await openReports(page);
    for (const name of TABS) {
      await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
    }
    for (const name of TABS) {
      const tab = page.getByRole('tab', { name, exact: true });
      // Tıklama yutulmasına karşı seçili olana kadar tekrar dene.
      await expect(async () => {
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
      }).toPass({ timeout: 15000 });
      // Panel gerçekten o sekmenin içeriğini render etti mi? (salt aria-selected değil)
      await expect(page.getByText(TAB_SIGNATURES[name], { exact: false }).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('rapor eylem butonları görünüyor', async ({ page }) => {
    await openReports(page);
    for (const name of ACTIONS) {
      await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
    }
  });

  test('Report Types sekmesi rapor kategorilerini gösteriyor', async ({ page }) => {
    await openReports(page);
    for (const cat of ['Call Reports', 'Agent Performance', 'AI Reports', 'SLA Reports']) {
      await expect(page.getByRole('heading', { name: cat, exact: true })).toBeVisible();
    }
  });

  // BULGU (keşifte çıktı): AI Insights içeriği konsola intl FORMATTING_ERROR düşürüyor
  // ("...variable 'type' was not provided to the string 'Generate AI insights...'").
  // Bkz. AGENTS.md "Responsive/taşma ve erişilebilirlik standardı" komşusu: sessiz-hata guard.
  test('sayfa intl FORMATTING_ERROR sessiz hatası üretmemeli @known-bug', async ({ page, diagnostics }) => {
    knownBugGuard(test, 'REPORTS-INTL'); // hata açıkken beklenen başarısızlık; düzelince "beklenmedik geçiş"
    await openReports(page);
    const tab = page.getByRole('tab', { name: 'AI Insights', exact: true });
    await expect(async () => {
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await waitForUiToSettle(page);
    diagnostics.assertClean();
  });

  // BULGU (keşifte çıktı): AI Insights panelinde ham i18n anahtarı sızıyor.
  // Bkz. AGENTS.md "Çok dilli (i18n) doğrulama standardı" → iç/ham anahtar = bulgu.
  test('AI Insights panelinde ham i18n anahtarı sızmamalı (reports.aiInsightsDesc) @known-bug', async ({ page }) => {
    knownBugGuard(test, 'REPORTS-AIKEY'); // bulgu açıkken beklenen başarısızlık; çevrilince "beklenmedik geçiş"
    await openReports(page);
    const tab = page.getByRole('tab', { name: 'AI Insights', exact: true });
    await expect(async () => {
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(page.getByText('reports.aiInsightsDesc', { exact: false })).toHaveCount(0);
  });
});
