// @ts-check
import { test, expect } from './fixtures/test.js';
import { TicketsPage } from './pages/TicketsPage.js';
import {
  knownBugGuard,
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  waitForUiToSettle,
  mockApi,
  expectDialogKeyboard,
} from './helpers.js';

/**
 * TICKETS (`/tickets`) — girişli, SALT-OKUNUR.
 * TIER-1: nav-blanket → dedicated L2·deep. Yapı/sekme/arama davranışları + tam stil
 * sözleşmesi (@i18n 4-dil, @a11y, @layout, @clean, @deeplink, @keyboard, @errorpath).
 * Etkileşim derinliği (@ix-*): tickets-interactions.authed.spec.js.
 * Veri değiştiren işlemler (Create Ticket / Export) TETİKLENMEZ.
 */

const I18N = TicketsPage.I18N;
const TICKETS_API = '/api/v1/tickets';

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('Tickets — yapı (tablo, sekme & arama)', () => {
  test('tablo beklenen kolonları gösteriyor @critical', async ({ app }) => {
    const { tickets } = app;
    await tickets.open();
    for (const col of TicketsPage.COLUMNS) {
      await expect(tickets.column(col)).toBeVisible();
    }
  });

  test('sekmeler (All / My Tickets / Unassigned / Urgent) görünüyor @smoke', async ({ app }) => {
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

// ──────────────────────── 4 DİL i18n GUARD'LARI ────────────────────────
// NOT: fr başlığı çevrilmiyor (I18N.fr.heading='Tickets') — gözlenen gerçek;
// sekme+kolon her dilde çevrilir. dir ar'da rtl.
test.describe("Tickets — 4 dil çeviri guard'ları @i18n @regression", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] yön + başlık + sekmeler + kolonlar çevrili`, async ({ app }) => {
      const { tickets } = app;
      await tickets.open();
      if (t.endonym) await tickets.switchLanguage(t.endonym);

      await expect(tickets.page.locator('html')).toHaveAttribute('dir', t.dir);
      await expect(tickets.heading).toHaveText(t.heading);
      for (const name of t.tabs) {
        await expect(tickets.tab(name)).toBeVisible();
      }
      for (const col of t.columns) {
        await expect(tickets.column(col)).toBeVisible();
      }
    });
  }
});

// ═══════════════════════ STİL SÖZLEŞMESİ ═══════════════════════
// @a11y — TICKETS-TABS-ARIA bilinen hatası: sekmeler geçersiz ARIA attribute değeri
// taşıyor (axe aria-valid-attr-value critical) → known-bug guard ile expected-fail
// (voice-history VOICE-HISTORY-A11Y-LABEL deseni). Diğer stil boyutları temiz geçer.
test.describe('Tickets — erişilebilirlik @a11y @known-bug', () => {
  test('TICKETS-TABS-ARIA · /tickets · sekmeler geçerli ARIA attribute değeri taşımalı (aria-valid-attr-value)', async ({ app }) => {
    knownBugGuard(test, 'TICKETS-TABS-ARIA');
    const { tickets } = app;
    await tickets.open();
    await expectNoSevereA11y(tickets.page);
  });
});

test.describe('Tickets — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/tickets');
  });
});

test.describe('Tickets — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const { tickets } = app;
    await tickets.open();
    await waitForUiToSettle(tickets.page);
    diagnostics.assertClean();
  });
});

test.describe('Tickets — deep-link @deeplink', () => {
  test('/tickets doğrudan açılınca yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const { tickets } = app;
    await page.goto('/tickets', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(tickets.shell.loginHeading).toBeHidden();
    await expect(tickets.heading).toHaveText(I18N.en.heading);
  });
});

test.describe('Tickets — klavye/odak @keyboard', () => {
  test('Create Ticket dialogu odak tuzağı + Escape ile kapanma (GÖNDERİLMEZ)', async ({ app }) => {
    const { tickets } = app;
    await tickets.open();
    const dialog = await tickets.openCreateForm();
    await expectDialogKeyboard(tickets.page, dialog);
  });
});

test.describe('Tickets — hata-yolu @errorpath', () => {
  test('tickets listesi 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${TICKETS_API}**`, { status: 500 });
    const { tickets } = app;
    await page.goto('/tickets', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(tickets.shell.loginHeading).toBeHidden();
    await expect(tickets.heading).toHaveText(I18N.en.heading);
  });
});
