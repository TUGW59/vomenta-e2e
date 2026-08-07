// @ts-check
import { test } from './fixtures/test.js';
import { assertTabsExclusive } from './support/interactions.js';
import { AutomationsPage } from './pages/AutomationsPage.js';

/**
 * AYARLAR → OTOMASYONLAR (`/settings/automations`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-1 / ADR-0014, FAZ 1). SALT-OKUNUR.
 *
 * Bu yüzeyin gerçek etkileşim boyutu SEKME'dir (@ix-tabs): Rules ↔ SLA Policies seçimi
 * dışlayıcıdır (tek aria-selected) ve panel içeriği değişir (Rules boş-durum imzası).
 * SLA tablo derinliği ayrı /settings/sla rotasında sahiplenilir (naInteraction).
 * Mutasyon YAPILMAZ.
 */

const I18N = AutomationsPage.I18N;

test.describe('Otomasyonlar — sekme etkileşim derinliği', () => {
  test('Rules ↔ SLA Policies sekmeleri dışlayıcı seçilir + panel değişir @ix-tabs', async ({ app }) => {
    const a = app.automations;
    await a.open();
    await assertTabsExclusive(a.page, (name) => a.tab(name), I18N.en.tabs, {
      Rules: I18N.en.emptyRules,
    });
  });
});
