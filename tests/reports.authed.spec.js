// @ts-check
import { test, expect } from './fixtures/test.js';
import { gotoApp } from './helpers.js';

/**
 * Reports sayfası testleri (girişli, salt-okunur).
 * Rapor OLUŞTURMA / dışa aktarma (Export All vb.) tıklanmaz — sadece görünürlük.
 */

const TABS = ['Report Types', 'Recent', 'AI Insights'];
const ACTIONS = ['Export All', 'Custom Report', 'New Dashboard', 'Schedule a Report'];

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

  test('sekmeler görünüyor ve tıklanınca seçili duruma geçiyor', async ({ page }) => {
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
});
