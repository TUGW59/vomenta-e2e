// @ts-check
import { test, expect } from './fixtures/test.js';
import { CampaignsOutboundPage } from './pages/CampaignsOutboundPage.js';
import {
  assertTableStructure,
  assertFilterNarrows,
  assertEmptyState,
} from './support/interactions.js';

/**
 * KAMPANYALAR → GİDEN (`/campaigns/outbound`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (C1 / ADR-0014). SALT-OKUNUR.
 *
 * Kampanya tablosu üzerinde read-only etkileşim boyutlarını makine-okur işaretlerle
 * doğrular: durum sekmeleri dışlayıcılığı (@ix-tabs), tablo yapısı + veri satırı
 * (@ix-table), arama-süzme + temizleme (@ix-filter), eşleşmeyen aramada boş-durum
 * (@ix-empty). Davranışlar campaigns-outbound.authed.spec.js'te zaten kanıtlı.
 *
 * Kapsam-dışı (naInteraction): pagination-sort → CAMPAIGNS-PAGER (liste 10'da kapanıyor,
 * hasNextPage:true AMA pager/sonsuz-kaydırma UI'si YOK → sayfa döndürülemez); loading-state
 * → ayrı iskelet gözlenmedi. Mutasyon (Create/Start/Delete) YAPILMAZ.
 */
const I18N = CampaignsOutboundPage.I18N;

test.describe('Giden Kampanyalar — etkileşim derinliği', () => {
  test('durum sekmeleri tek-seçim dışlayıcı (aria-selected) @ix-tabs', async ({ app }) => {
    const oc = app.campaignsOutbound;
    await oc.open();
    const names = [I18N.en.tabs.all, I18N.en.tabs.running, I18N.en.tabs.paused];
    for (const name of names) {
      await oc.selectTab(name); // hardened (hidrasyon yarışı)
      await expect(oc.tab(name)).toHaveAttribute('aria-selected', 'true');
      for (const other of names) {
        if (other === name) continue;
        await expect(oc.tab(other)).toHaveAttribute('aria-selected', 'false');
      }
    }
  });

  test('kampanya tablosu kolonları + en az bir veri satırı gösteriyor @ix-table', async ({ app }) => {
    const oc = app.campaignsOutbound;
    await oc.open();
    await assertTableStructure(oc.table, oc.rows);
  });

  test('arama satırları süzüyor ve temizleyince geri getiriyor @ix-filter', async ({ app }) => {
    const oc = app.campaignsOutbound;
    await oc.open();
    await assertFilterNarrows(oc.rows, oc.searchInput);
  });

  test('eşleşmeyen aramada boş-durum ("No campaigns match your filters") @ix-empty', async ({ app }) => {
    const oc = app.campaignsOutbound;
    await oc.open();
    await assertEmptyState(oc.page, oc.rows, oc.searchInput, /no campaigns match|kampanya|aucune campagne|لا توجد/i);
  });
});
