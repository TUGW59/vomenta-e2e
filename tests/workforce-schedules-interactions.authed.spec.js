// @ts-check
import { test } from './fixtures/test.js';
import { assertTableStructure } from './support/interactions.js';

/**
 * İŞ GÜCÜ › PROGRAMLAR (`/workforce/schedules`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-2 / ADR-0014 / ADR-0029, FAZ 4). SALT-OKUNUR.
 *
 * Keşif: docs/workforce-kesif/NOTLAR.md (30 Tem 2026). Dedicated rota, sekmesiz
 * standalone haftalık çizelge. Tek gerçek etkileşim boyutu TABLO'dur (@ix-table):
 * satırlar tenant baseline ajanlarıdır (güncel haftada dolu).
 *
 * Diğer 4 veri boyutu tested-pages.js'te naInteraction ile gerekçeli N/A: metin arama
 * kutusu yok (yalnız hafta ok'ları); pager/sıralama yok; boş-durum arama/filtre ile
 * üretilmiyor; kararlı liste-yükleme iskeleti yok. Mutasyon YAPILMAZ.
 */

test.describe('İş Gücü Programlar — çizelge tablosu etkileşim derinliği', () => {
  test('Haftalık çizelge tablosu ajan satırlarıyla render olur @ix-table', async ({ app }) => {
    const s = app.workforceSchedules;
    await s.open();
    await assertTableStructure(s.scheduleTable(), s.scheduleRows(), []);
  });
});
