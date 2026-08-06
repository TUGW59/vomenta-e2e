// @ts-check
import { test } from '../fixtures/test.js';
import { assertTabsExclusive } from '../support/interactions.js';
import { DashboardsPage } from '../pages/DashboardsPage.js';

/**
 * RAPORLAR → PANOLAR (`/reports/dashboards`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-2 / ADR-0014 / ADR-0029, FAZ 3). SALT-OKUNUR.
 *
 * Keşif: docs/reports-panolar-kesif/NOTLAR.md (28 Tem 2026). Tek gerçek, veri-bağımsız
 * etkileşim boyutu ÜST SEKME'dir (@ix-tabs): All Dashboards / Default / Custom Dashboards
 * salt-istemci filtre sekmeleri dışlayıcı seçilir (tek aria-selected).
 *
 * Diğer 5 veri boyutu tested-pages.js'te naInteraction ile gerekçeli N/A: panolar kart
 * ızgarasıdır (role=table değil); arama kutusu/pager yok; boş "Default" bölümü arama/filtre
 * ile üretilmez. Mutasyon YAPILMAZ (Create/Edit/Share/Duplicate/Delete asla tetiklenmez).
 */

const TABS = DashboardsPage.I18N.en.tabs;

test.describe('Panolar — sekme etkileşim derinliği', () => {
  test('All Dashboards / Default / Custom Dashboards sekmeleri dışlayıcı seçilir @ix-tabs', async ({ app }) => {
    const d = app.dashboards;
    await d.open();
    await assertTabsExclusive(d.page, (name) => d.tab(name), TABS);
  });
});
