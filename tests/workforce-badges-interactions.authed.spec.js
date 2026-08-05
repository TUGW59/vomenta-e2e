// @ts-check
import { test } from './fixtures/test.js';
import { assertTabsExclusive } from './support/interactions.js';

/**
 * İŞ GÜCÜ › ROZETLER (`/workforce/badges`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-2 / ADR-0014 / ADR-0029, FAZ 4). SALT-OKUNUR.
 *
 * Keşif: docs/workforce-kesif/NOTLAR.md (30 Tem 2026). Tek gerçek, veri-bağımsız
 * etkileşim boyutu ÜST SEKME'dir (@ix-tabs): Badges ↔ Leaderboard dışlayıcı seçilir
 * (tek aria-selected). Sekme locator'ı ANA (ilk) tablist'e sabitlenir (ikinci tab bar
 * mount gözlemine karşı).
 *
 * Diğer 5 veri boyutu tested-pages.js'te naInteraction ile gerekçeli N/A: rozet listesi
 * test tenant'ında BOŞ ("No badges yet") → dolu read-only tablo satırı yok; arama kutusu/
 * pager yok; boş-durum arama/filtre ile üretilmiyor; kararlı iskelet yok. Mutasyon
 * YAPILMAZ (Create/Award badge asla gönderilmez — dışa dönük etki).
 */

const TABS = ['Badges', 'Leaderboard'];

test.describe('İş Gücü Rozetler — sekme etkileşim derinliği', () => {
  test('Badges ↔ Leaderboard sekmeleri dışlayıcı seçilir @ix-tabs', async ({ app }) => {
    const b = app.workforceBadges;
    await b.open();
    await assertTabsExclusive(b.page, (name) => b.tab(name), TABS);
  });
});
