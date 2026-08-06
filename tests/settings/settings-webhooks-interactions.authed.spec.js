// @ts-check
import { test, expect } from '../fixtures/test.js';
import { WebhooksPage } from '../pages/WebhooksPage.js';

/**
 * AYARLAR → WEBHOOKS (`/settings/webhooks`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-1 / ADR-0014, FAZ 1). SALT-OKUNUR.
 *
 * Deterministik read-only etkileşim boyutu BOŞ-DURUM'dur (@ix-empty): webhook listesi
 * read-only tenant'ta boştur ve "No webhooks configured" mesajı render edilir (mevcut
 * settings-webhooks.authed.spec.js de doğrular). Dolu tablo / arama / pager / iskelet yok
 * (webhook oluşturma L3 mutasyon). Mutasyon YAPILMAZ.
 */

const I18N = WebhooksPage.I18N;

test.describe('Webhooks — boş-durum etkileşim derinliği', () => {
  test('boş-durum mesajı render ediliyor ("No webhooks configured") @ix-empty', async ({ app }) => {
    const w = app.webhooks;
    await w.open();
    await expect(w.page.getByText(I18N.en.empty, { exact: false }).first()).toBeVisible();
  });
});
