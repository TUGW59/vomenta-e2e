// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Settings sayfası testleri (girişli, salt-okunur).
 * Ayar DEĞİŞTİREN işlemler (kaydet vb.) TEST EDİLMEZ.
 */

const TABS = ['Organization', 'Users', 'Billing & Usage', 'Security', 'API Keys', 'Modules'];

async function openSettings(page) {
  await page.goto('/settings', { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await expect(
    page.getByRole('heading', { name: 'Settings', exact: true })
  ).toBeVisible({ timeout: 30000 });
}

test.describe('Vomenta - Settings (sekmeler)', () => {
  test('sayfa "Settings" başlığıyla açılıyor', async ({ page }) => {
    await openSettings(page);
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  });

  test('tüm sekmeler görünüyor', async ({ page }) => {
    await openSettings(page);
    for (const name of TABS) {
      await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
    }
  });

  test('her sekme tıklanınca seçili duruma geçiyor', async ({ page }) => {
    await openSettings(page);
    for (const name of TABS) {
      const tab = page.getByRole('tab', { name, exact: true });
      await expect(tab).toBeVisible();
      // Radix sekmeleri içerik yüklenirken yeniden render olabildiğinden tıklama
      // bazen yutulabiliyor; seçili olana kadar tıkla-ve-doğrula'yı tekrarla.
      await expect(async () => {
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
      }).toPass({ timeout: 15000 });
    }
  });
});
