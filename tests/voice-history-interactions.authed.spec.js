// @ts-check
import { test, expect } from './fixtures/test.js';
import { VoiceSubPage } from './pages/VoiceSubPage.js';

/**
 * VOICE › Arama Geçmişi (`/voice/history`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WAVE-L2-DEEP-2 / ADR-0014). SALT-OKUNUR.
 *
 * Çağrı geçmişi tablosu üzerinde read-only etkileşim boyutunu makine-okur işaretle
 * doğrular: tablo/liste yapısı + en az bir veri satırı (@ix-table). Tablo render'ı
 * `GET /api/v1/voice/calls` ile veri-bağlı (voice-history.authed.spec.js veri-sadakati testinde kanıtlı).
 *
 * Kapsam-dışı (sözleşmede naInteraction, dürüst):
 *  - search-filter/empty-state: serbest-metin satır-arama kutusu yok (yalnız yön +
 *    tarih ön-filtreleri; yön filtresi veri-bağlı, tek-yön veride daralma garanti
 *    değil → anti-loop #3).
 *  - pagination-sort / loading-state: read-only tek-sayfa; ayrı pager/iskelet gözlenmedi.
 * Mutasyon ("Call back" = gerçek giden çağrı) ASLA tetiklenmez.
 */
const KEY = 'history';

test.describe('Arama Geçmişi — tablo etkileşim derinliği', () => {
  test('çağrı geçmişi tablosu + en az bir veri satırı gösteriyor @ix-table', async ({ app }) => {
    const h = app.voiceSub(KEY);
    await h.open();
    await expect(h.table).toBeVisible({ timeout: 15000 });
    await expect(h.rows.first()).toBeVisible({ timeout: 15000 });
    await expect(h.rows.first()).toContainText(/\S/);
  });
});
