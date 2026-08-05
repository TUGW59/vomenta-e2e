// @ts-check
import { test, expect } from './fixtures/test.js';
import { ApiKeysPage } from './pages/ApiKeysPage.js';

/**
 * AYARLAR → API ANAHTARLARI (`/settings/api-keys`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-1 / ADR-0014, FAZ 1). SALT-OKUNUR.
 *
 * Bu yüzeyin deterministik read-only etkileşim boyutu BOŞ-DURUM'dur (@ix-empty):
 * anahtar listesi read-only tenant'ta boştur ve "No API keys" boş-durum mesajı render
 * edilir (mevcut settings-api-keys.authed.spec.js de bu mesajı doğrular). Dolu tablo /
 * arama / pager / iskelet bu yüzeyde yok (anahtar oluşturma L3 mutasyon). Mutasyon YAPILMAZ.
 */

const I18N = ApiKeysPage.I18N;

test.describe('API Anahtarları — boş-durum etkileşim derinliği', () => {
  test('boş-durum mesajı render ediliyor ("No API keys") @ix-empty', async ({ app }) => {
    const a = app.apiKeys;
    await a.open();
    await expect(a.page.getByText(I18N.en.empty, { exact: false }).first()).toBeVisible();
  });
});
