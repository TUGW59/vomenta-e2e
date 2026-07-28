// @ts-check
import { test, expect } from './fixtures/test.js';
import { SettingsPage } from './pages/SettingsPage.js';

/**
 * Settings sayfası testleri (girişli, salt-okunur).
 * Ayar DEĞİŞTİREN işlemler (kaydet vb.) TEST EDİLMEZ.
 */

/**
 * Her sekmenin panel içerik imzası (canlı gözlem, 28 Tem 2026). Sekme "seçili"
 * görünürken panelinin gerçekten o sekmenin içeriğini render ettiğini doğrular —
 * bkz. AGENTS.md "İçerik ve değer derinliği standardı".
 */
const TAB_SIGNATURES = {
  Organization: 'Go to Organization Settings',
  Users: 'Team Members',
  'Billing & Usage': 'Current Plan',
  Security: 'Security Settings',
  'API Keys': 'Create key',
  Modules: 'Manage add-on modules',
};

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

  test('her sekme tıklanınca seçili oluyor VE paneli o içeriği gösteriyor', async ({ app, page }) => {
    const { settings } = app;
    await settings.open();
    for (const name of SettingsPage.TABS) {
      await expect(settings.tab(name)).toBeVisible();
      await settings.selectTab(name); // aria-selected='true' doğrular
      // Panel gerçekten o sekmenin içeriğini render etti mi?
      await expect(page.getByText(TAB_SIGNATURES[name], { exact: false }).first()).toBeVisible({ timeout: 10000 });
    }
  });
});
