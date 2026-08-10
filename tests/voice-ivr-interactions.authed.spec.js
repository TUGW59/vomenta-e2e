// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * VOICE › IVR (`/voice/ivr`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WAVE-L2-DEEP-2 / ADR-0014). SALT-OKUNUR.
 *
 * IVR akış listesi tablosu üzerinde read-only etkileşim boyutunu makine-okur
 * işaretle doğrular: tablo/liste yapısı + en az bir veri satırı (@ix-table).
 * Tablo `GET /api/v1/ivr` ile veri-bağlı.
 *
 * Kapsam-dışı (sözleşmede naInteraction, dürüst):
 *  - search-filter/empty-state: serbest-metin satır-arama kutusu gözlenmedi.
 *  - pagination-sort / loading-state: read-only tek-sayfa; ayrı pager/iskelet gözlenmedi.
 * Mutasyon (akış oluştur/düzenle/yayınla) ASLA tetiklenmez.
 */
const KEY = 'ivr';

test.describe('IVR — tablo etkileşim derinliği', () => {
  test('IVR akış tablosu + en az bir veri satırı gösteriyor @ix-table', async ({ app }) => {
    const p = app.voiceSub(KEY);
    await p.open();
    await expect(p.table).toBeVisible({ timeout: 15000 });
    await expect(p.rows.first()).toBeVisible({ timeout: 15000 });
    await expect(p.rows.first()).toContainText(/\S/);
  });
});
