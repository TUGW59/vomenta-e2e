// @ts-check
import { test } from './fixtures/test.js';
import { assertTabsExclusive } from './support/interactions.js';
import { ChannelWebchatPage } from './pages/ChannelWebchatPage.js';

/**
 * KANALLAR → WEB CHAT (`/channels/webchat`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-2 / ADR-0014 / ADR-0029, FAZ 2). SALT-OKUNUR.
 *
 * Bu rota bir yapılandırma yüzeyidir; tek gerçek etkileşim boyutu ÜST SEKME'dir
 * (@ix-tabs): Configuration ↔ Integration seçimi dışlayıcıdır (tek aria-selected).
 * Diğer 5 veri boyutu fiziksel olarak yok → tested-pages.js'te naInteraction ile
 * gerekçeli N/A (arama/tablo/pager/boş-durum/yükleme iskeleti gözlenmedi; sayfa
 * renk/metin girdileri + switch/textarea formudur). Mutasyon YAPILMAZ
 * ("Save Changes"/"Preview Widget" asla tetiklenmez).
 */

test.describe('Web Chat — üst sekme etkileşim derinliği', () => {
  test('Configuration ↔ Integration üst sekmeleri dışlayıcı seçilir @ix-tabs', async ({ app }) => {
    const c = app.channelWebchat;
    await c.open();
    await assertTabsExclusive(c.page, (name) => c.tab(name), ChannelWebchatPage.TABS);
  });
});
