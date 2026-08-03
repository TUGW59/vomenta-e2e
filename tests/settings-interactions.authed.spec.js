// @ts-check
import { test, expect } from './fixtures/test.js';
import { SettingsPage } from './pages/SettingsPage.js';

/**
 * AYARLAR HUB (`/settings`) — L2 ETKİLEŞİM DERİNLİĞİ (WP-L2-WAVE-1 / ADR-0014).
 *
 * Bu suite hub'ın TEK gerçek etkileşim boyutunu (sekmeler) makine-okur `@ix-tabs`
 * işaretiyle DERİNLEMESİNE doğrular: seçim dışlayıcılığı (tek aria-selected), panel
 * içeriğinin gerçekten değişmesi ve sekmeler-arası gidiş-dönüşte durumun tutarlılığı.
 *
 * SALT-OKUNUR: sekme değişimi saf istemci-tarafı (backend/mutation yok). Hub liste/
 * filtre/tablo/pagination/boş-durum İÇERMEZ (bunlar dedicated alt-rotalarda) → o
 * boyutlar sözleşmede `naInteraction` ile açık gerekçeyle N/A.
 *
 * Not: hub sekme testinin temel L1+L3 biçimi settings.authed.spec.js'de de vardır;
 * burada dışlayıcılık + gidiş-dönüş derinliği eklenir ve makine-okur işaret taşınır.
 */

const TAB_SIGNATURES = {
  Organization: 'Go to Organization Settings',
  Users: 'Team Members',
  'Billing & Usage': 'Current Plan',
  Security: 'Security Settings',
  'API Keys': 'Create key',
  Modules: 'Manage add-on modules',
};

test.describe('Ayarlar hub — sekme etkileşim derinliği', () => {
  test('sekme seçimi dışlayıcı + panel içeriği değişiyor @ix-tabs', async ({ app, page }) => {
    const { settings } = app;
    await settings.open();

    for (const name of SettingsPage.TABS) {
      await settings.selectTab(name); // aria-selected='true' (Radix click-yutma dayanıklı)

      // Dışlayıcılık: YALNIZ seçili sekme aria-selected='true'.
      const selected = page.getByRole('tab', { selected: true });
      await expect(selected).toHaveCount(1);
      await expect(settings.tab(name)).toHaveAttribute('aria-selected', 'true');

      // Panel gerçekten O sekmenin içeriğini render etti mi (görsel seçim ≠ içerik).
      await expect(
        page.getByText(TAB_SIGNATURES[name], { exact: false }).first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('sekmeler-arası gidiş-dönüşte seçim + içerik tutarlı @ix-tabs', async ({ app, page }) => {
    const { settings } = app;
    await settings.open();

    const first = SettingsPage.TABS[0];
    const other = SettingsPage.TABS[2];

    await settings.selectTab(other);
    await expect(settings.tab(other)).toHaveAttribute('aria-selected', 'true');

    // İlk sekmeye dön: seçim ilk sekmeye taşınır, panel ilk içeriğe döner.
    await settings.selectTab(first);
    await expect(settings.tab(first)).toHaveAttribute('aria-selected', 'true');
    await expect(settings.tab(other)).toHaveAttribute('aria-selected', 'false');
    await expect(
      page.getByText(TAB_SIGNATURES[first], { exact: false }).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
