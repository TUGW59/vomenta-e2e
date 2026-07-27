// @ts-check
import { test, expect } from './fixtures/test.js';
import { TicketsPage } from './pages/TicketsPage.js';

/**
 * Tickets sayfası veri/tablo etkileşim testleri (girişli, salt-okunur).
 * Veri değiştiren işlemler (Create Ticket / Export) TEST EDİLMEZ.
 */
test.describe('Vomenta - Tickets (tablo, sekme & arama)', () => {
  test('tablo beklenen kolonları gösteriyor @critical', async ({ app }) => {
    const { tickets } = app;
    await tickets.open();
    for (const col of TicketsPage.COLUMNS) {
      await expect(tickets.column(col)).toBeVisible();
    }
  });

  test('sekmeler (All / My Tickets / Unassigned / Urgent) görünüyor', async ({ app }) => {
    const { tickets } = app;
    await tickets.open();
    for (const name of TicketsPage.TABS) {
      await expect(tickets.tab(name)).toBeVisible();
    }
  });

  test('en az bir ticket listeleniyor @smoke', async ({ app }) => {
    const { tickets } = app;
    await tickets.open();
    expect(await tickets.rows.count()).toBeGreaterThan(1);
  });

  test('arama: ticket numarasına göre tek sonuca filtreliyor @critical', async ({ app, page }) => {
    const { tickets } = app;
    await tickets.open();

    const id = await tickets.firstTicketId();
    expect(id, 'ilk satırdan bir ticket numarası okunabilmeli').toBeTruthy();

    await tickets.searchFor(id);
    await expect(tickets.rows).toHaveCount(2); // başlık + 1 eşleşme
    await expect(page.getByRole('cell', { name: id, exact: true })).toBeVisible();
  });

  test('sekme filtresi: Unassigned sekmesi atanmamış ticketları gösteriyor', async ({ app, page }) => {
    const { tickets } = app;
    await tickets.open();
    await tickets.tab('Unassigned').click();
    await expect(tickets.table).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Unassigned' }).first()).toBeVisible();
  });

  test('arama: eşleşmeyen sorgu "No tickets found" boş-durumu gösteriyor', async ({ app }) => {
    const { tickets } = app;
    await tickets.open();
    await tickets.searchFor('zzz_no_match_xyz');
    await expect(tickets.emptyState).toBeVisible({ timeout: 15000 });
  });
});
