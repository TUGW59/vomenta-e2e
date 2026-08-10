// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * VOICE › Sesli Mesajlar (`/voice/voicemail`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WAVE-L2-DEEP-2 / ADR-0014). SALT-OKUNUR.
 *
 * Sesli mesaj tablosu üzerinde read-only etkileşim boyutunu makine-okur işaretle
 * doğrular: tablo/liste yapısı + en az bir veri satırı (@ix-table).
 *
 * Kapsam-dışı (sözleşmede naInteraction, dürüst):
 *  - search-filter/empty-state: serbest-metin satır-arama kutusu yok (yalnız
 *    durum/tarih ön-filtreleri; veri-bağlı daralma garanti değil → anti-loop #3).
 *  - pagination-sort / loading-state: read-only tek-sayfa; ayrı pager/iskelet gözlenmedi.
 * Mutasyon YAPILMAZ (satır aksiyonları destructive → tetiklenmez).
 */
const KEY = 'voicemail';

test.describe('Sesli Mesajlar — tablo etkileşim derinliği', () => {
  test('Sesli mesaj tablosu + en az bir veri satırı gösteriyor @ix-table', async ({ app }) => {
    const p = app.voiceSub(KEY);
    await p.open();
    await expect(p.table).toBeVisible({ timeout: 15000 });
    await expect(p.rows.first()).toBeVisible({ timeout: 15000 });
    await expect(p.rows.first()).toContainText(/\S/);
  });
});
