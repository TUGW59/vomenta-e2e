// @ts-check
import { test, expect } from './fixtures/test.js';
import { SettingsPage } from './pages/SettingsPage.js';

/**
 * Settings sayfası testleri (girişli, salt-okunur).
 * Ayar DEĞİŞTİREN işlemler (kaydet vb.) TEST EDİLMEZ.
 */
test.describe('Vomenta - Settings (sekmeler)', () => {
  test('sayfa "Settings" başlığıyla açılıyor @smoke', async ({ app }) => {
    const { settings } = app;
    await settings.open();
    await expect(settings.heading).toBeVisible();
  });

  test('tüm sekmeler görünüyor @critical', async ({ app }) => {
    const { settings } = app;
    await settings.open();
    for (const name of SettingsPage.TABS) {
      await expect(settings.tab(name)).toBeVisible();
    }
  });

  test('her sekme tıklanınca seçili duruma geçiyor', async ({ app }) => {
    const { settings } = app;
    await settings.open();
    for (const name of SettingsPage.TABS) {
      await expect(settings.tab(name)).toBeVisible();
      await settings.selectTab(name);
    }
  });
});
