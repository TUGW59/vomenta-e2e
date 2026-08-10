// @ts-check
import { test, expect } from './fixtures/test.js';
import { TicketsPage } from './pages/TicketsPage.js';
import {
  assertTableStructure,
  assertFilterNarrows,
  assertEmptyState,
} from './support/interactions.js';

/**
 * TICKETS (`/tickets`) — L2 ETKİLEŞİM DERİNLİĞİ (TIER-1 / ADR-0014). SALT-OKUNUR.
 *
 * Ticket tablosu üzerinde read-only etkileşim boyutlarını makine-okur işaretlerle
 * doğrular: sekme dışlayıcılığı (@ix-tabs), tablo yapısı + veri satırı (@ix-table),
 * arama-süzme + temizleme (@ix-filter), eşleşmeyen aramada boş-durum (@ix-empty).
 * Bu davranışlar tickets.authed.spec.js'te zaten kanıtlı; burada @ix-* ile sabitlenir.
 *
 * Kapsam-dışı (naInteraction): pagination-sort + loading-state (read-only tek-sayfa;
 * ayrı pager/iskelet gözlenmedi). Mutasyon (Create Ticket) YAPILMAZ.
 */

test.describe('Tickets — etkileşim derinliği', () => {
  test('sekmeler tek-seçim dışlayıcı (aria-selected) @ix-tabs', async ({ app }) => {
    const { tickets } = app;
    await tickets.open();
    for (const name of TicketsPage.TABS) {
      await tickets.selectTab(name); // hidrasyon-yarışına karşı retry'lı
      await expect(tickets.tab(name)).toHaveAttribute('aria-selected', 'true');
      for (const other of TicketsPage.TABS) {
        if (other === name) continue;
        await expect(tickets.tab(other)).toHaveAttribute('aria-selected', 'false');
      }
    }
  });

  test('ticket tablosu kolonları + en az bir veri satırı gösteriyor @ix-table', async ({ app }) => {
    const { tickets } = app;
    await tickets.open();
    await assertTableStructure(tickets.table, tickets.dataRows, ['Ticket #', 'Subject']);
  });

  test('arama satırları süzüyor ve temizleyince geri getiriyor @ix-filter', async ({ app }) => {
    const { tickets } = app;
    await tickets.open();
    await assertFilterNarrows(tickets.dataRows, tickets.search);
  });

  test('eşleşmeyen aramada boş-durum (0 satır veya "bulunamadı") @ix-empty', async ({ app }) => {
    const { tickets } = app;
    await tickets.open();
    await assertEmptyState(tickets.page, tickets.dataRows, tickets.search);
  });
});
