// @ts-check
import { test, expect } from '@playwright/test';
import { SettingsPage } from './pages/SettingsPage';

/**
 * Settings sayfası testleri (girişli, salt-okunur).
 * Ayar DEĞİŞTİREN işlemler (kaydet vb.) TEST EDİLMEZ.
 */
test.describe('Vomenta - Settings (sekmeler)', () => {
  test('sayfa "Settings" başlığıyla açılıyor', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.open();
    await expect(settings.heading).toBeVisible();
  });

  test('tüm sekmeler görünüyor', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.open();
    for (const name of SettingsPage.TABS) {
      await expect(settings.tab(name)).toBeVisible();
    }
  });

  test('her sekme tıklanınca seçili duruma geçiyor', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.open();
    for (const name of SettingsPage.TABS) {
      await expect(settings.tab(name)).toBeVisible();
      await settings.selectTab(name);
    }
  });
});
