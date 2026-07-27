// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Tickets sayfası veri/tablo etkileşim testleri (girişli, salt-okunur).
 * Veri değiştiren işlemler (Create Ticket / Export) TEST EDİLMEZ.
 */

async function openTickets(page) {
  await page.goto('/tickets', { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await expect(page.getByRole('table')).toBeVisible({ timeout: 30000 });
  // İlk veri satırının numara hücresi dolana kadar bekle (skeleton/loading değil).
  await expect(
    page.getByRole('row').nth(1).getByRole('cell').first()
  ).toHaveText(/\S/, { timeout: 30000 });
}

const COLUMNS = ['Ticket #', 'Subject', 'Customer', 'Priority', 'Status', 'Assigned To', 'Created'];
const TABS = ['All', 'My Tickets', 'Unassigned', 'Urgent'];

test.describe('Vomenta - Tickets (tablo, sekme & arama)', () => {
  test('tablo beklenen kolonları gösteriyor', async ({ page }) => {
    await openTickets(page);
    for (const col of COLUMNS) {
      await expect(
        page.getByRole('columnheader', { name: col, exact: true })
      ).toBeVisible();
    }
  });

  test('sekmeler (All / My Tickets / Unassigned / Urgent) görünüyor', async ({ page }) => {
    await openTickets(page);
    for (const tab of TABS) {
      await expect(page.getByRole('tab', { name: tab, exact: true })).toBeVisible();
    }
  });

  test('en az bir ticket listeleniyor', async ({ page }) => {
    await openTickets(page);
    expect(await page.getByRole('row').count()).toBeGreaterThan(1);
  });

  test('arama: ticket numarasına göre tek sonuca filtreliyor', async ({ page }) => {
    await openTickets(page);
    const rows = page.getByRole('row');
    await expect(rows.nth(1)).toBeVisible();

    // İlk ticket'ın numarasını al (ör. "T-0003") ve onunla ara.
    const id = (await rows.nth(1).getByRole('cell').first().innerText()).trim();
    expect(id, 'ilk satırdan bir ticket numarası okunabilmeli').toBeTruthy();

    const search = page.getByPlaceholder(/Search tickets/);
    await search.fill(id);

    // Benzersiz numara -> yalnızca o ticket görünmeli (başlık + 1 satır).
    await expect(rows).toHaveCount(2);
    await expect(page.getByRole('cell', { name: id, exact: true })).toBeVisible();
  });

  test('sekme filtresi: Unassigned sekmesi atanmamış ticketları gösteriyor', async ({ page }) => {
    await openTickets(page);
    await page.getByRole('tab', { name: 'Unassigned', exact: true }).click();
    // Filtre sonrası tablo hâlâ görünür ve (mevcut veride) atanmamış ticketlar listelenir.
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Unassigned' }).first()).toBeVisible();
  });
});
