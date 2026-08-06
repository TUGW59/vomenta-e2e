// @ts-check
import { test, expect } from '../fixtures/test.js';
import { CannedResponsesPage } from '../pages/CannedResponsesPage.js';

/**
 * AYARLAR → HAZIR YANITLAR (`/settings/canned-responses`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-1 / ADR-0014, FAZ 1). SALT-OKUNUR.
 *
 * Deterministik read-only etkileşim boyutu BOŞ-DURUM'dur (@ix-empty): liste read-only
 * tenant'ta boştur ve "No canned responses yet" mesajı render edilir. Arama kutusu var
 * ancak boş listede daraltacak satır yok; dolu tablo/pager/iskelet yok (kayıt oluşturma
 * L3 mutasyon). Mutasyon YAPILMAZ.
 */

const I18N = CannedResponsesPage.I18N;

test.describe('Hazır Yanıtlar — boş-durum etkileşim derinliği', () => {
  test('boş-durum mesajı render ediliyor ("No canned responses yet") @ix-empty', async ({ app }) => {
    const a = app.cannedResponses;
    await a.open();
    await expect(a.page.getByText(I18N.en.empty, { exact: false }).first()).toBeVisible();
  });
});
