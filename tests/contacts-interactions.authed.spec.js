// @ts-check
import { test, expect } from './fixtures/test.js';
import {
  assertTableStructure,
  assertFilterNarrows,
  assertEmptyState,
} from './support/interactions.js';

/**
 * KİŞİLER (`/contacts`) — L2 ETKİLEŞİM DERİNLİĞİ (TIER-1 / ADR-0014). SALT-OKUNUR.
 *
 * Kişi tablosu üzerinde read-only etkileşim boyutlarını makine-okur işaretlerle
 * doğrular: tablo/liste yapısı + veri satırı (@ix-table), ada göre arama-süzme +
 * temizleme (@ix-filter), eşleşmeyen aramada boş-durum (@ix-empty). Bu davranışlar
 * contacts.authed.spec.js'te L1/L2/L3 olarak zaten kanıtlı; burada makine-okur
 * `@ix-*` derinlik işaretiyle sabitlenir.
 *
 * Kapsam-dışı (sözleşmede naInteraction, dürüst): pagination/sort (chip-tabanlı
 * sıralama @regression'da; read-only tek-sayfa pager gözlenmedi) ve ayrı liste-
 * yükleme iskeleti. Mutasyon (New Contact / Import / Export) YAPILMAZ.
 */

/** Hücre içeren satırlar = veri satırları (kolon-başlığı satırı hariç). */
function dataRows(page) {
  return page.getByRole('row').filter({ has: page.getByRole('cell') });
}

test.describe('Kişiler — tablo etkileşim derinliği', () => {
  test('kişi tablosu kolonları + en az bir veri satırı gösteriyor @ix-table', async ({ app }) => {
    const { contacts } = app;
    await contacts.open();
    await assertTableStructure(contacts.table, dataRows(contacts.page));
  });

  test('ada göre arama satırları süzüyor ve temizleyince geri getiriyor @ix-filter', async ({ app }) => {
    const { contacts } = app;
    await contacts.open();
    await assertFilterNarrows(dataRows(contacts.page), contacts.search);
  });

  test('eşleşmeyen aramada boş-durum (0 satır veya "bulunamadı") @ix-empty', async ({ app }) => {
    const { contacts } = app;
    await contacts.open();
    await assertEmptyState(contacts.page, dataRows(contacts.page), contacts.search);
  });
});
