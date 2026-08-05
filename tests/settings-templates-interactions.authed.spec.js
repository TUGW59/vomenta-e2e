// @ts-check
import { test } from './fixtures/test.js';
import { assertTabsExclusive } from './support/interactions.js';
import { TemplatesPage } from './pages/TemplatesPage.js';

/**
 * AYARLAR → ŞABLONLAR (`/settings/templates`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-1 / ADR-0014, FAZ 1). SALT-OKUNUR.
 *
 * Gerçek etkileşim boyutu ÜST SEKME'dir (@ix-tabs): Message templates ↔ Canned Responses
 * seçimi dışlayıcıdır (tek aria-selected). Tablo kategori başına boş-durumlu ("No templates
 * in this category") → dolu read-only satır garanti değil → tablo boyutu naInteraction.
 * Mutasyon YAPILMAZ.
 */

const I18N = TemplatesPage.I18N;

test.describe('Şablonlar — üst sekme etkileşim derinliği', () => {
  test('Message templates ↔ Canned Responses üst sekmeleri dışlayıcı seçilir @ix-tabs', async ({ app }) => {
    const a = app.templates;
    await a.open();
    await assertTabsExclusive(a.page, (name) => a.topTab(name), I18N.en.topTabs);
  });
});
