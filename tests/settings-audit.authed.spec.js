// @ts-check
import { test, expect } from './fixtures/test.js';
import { AuditLogPage } from './pages/AuditLogPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * AYARLAR › DENETİM GÜNLÜĞÜ (`/settings/audit`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * SALT-OKUMA sayfa: yazma YOK → @mutation yok. Export bir CSV indirir (veri değiştirmez) → test edilir.
 */

const I18N = AuditLogPage.I18N;
const API = AuditLogPage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Denetim Günlüğü — yapı', () => {
  test('sayfa başlığı + Export + tablo ile açılıyor @smoke', async ({ app }) => {
    const a = app.auditLog;
    await a.open();
    await expect(a.heading).toHaveText(I18N.en.heading);
    await expect(a.exportButton).toBeVisible();
    await expect(a.table).toBeVisible();
  });

  test('tablo kolonları + en az bir log satırı görünüyor @critical', async ({ app }) => {
    const a = app.auditLog;
    await a.open();
    for (const col of I18N.en.columns) {
      await expect(a.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }
    await expect(a.rows.first()).toBeVisible();
  });
});

// ──────────── 3 KATMAN: SATIR "View" DETAY DIALOG (@regression) ────────────
test.describe('Denetim Günlüğü — View detay dialogu @regression', () => {
  test('L1 tıklama OK: "View" → "Change details" dialogu açılıyor', async ({ app }) => {
    const a = app.auditLog;
    await a.open();
    const dialog = await a.openViewDialog();
    await expect(dialog.getByRole('heading', { name: I18N.en.viewDialog, exact: true })).toBeVisible();
    // Görünüm tutarlılığı: dialog "Performed by" ve "Entity" bilgisini gösterir.
    await expect(dialog.getByText('Performed by', { exact: false })).toBeVisible();
    await a.page.keyboard.press('Escape');
  });
});

// ═══════════════ STİL: EXPORT (@export) ═══════════════
// Export bir CSV indirir (salt-okuma; veri değiştirmez). İndirme olayı + dosya adı doğrulanır.
test.describe('Denetim Günlüğü — export @export', () => {
  test('Export tıklanınca audit-log CSV indiriliyor', async ({ app }) => {
    const a = app.auditLog;
    await a.open();
    // CSV, yüklü satırlardan istemci-tarafı üretilir → önce en az bir satır yüklenmeli.
    await expect(a.rows.first()).toBeVisible({ timeout: 15000 });
    const download = await Promise.all([
      a.page.waitForEvent('download', { timeout: 15000 }),
      a.exportButton.click(),
    ]).then(([d]) => d);
    expect(download.suggestedFilename()).toMatch(/audit-log.*\.csv$/i);
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Denetim Günlüğü — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + kolonlar + Export çevrili`, async ({ app }) => {
      const a = app.auditLog;
      await a.open();
      if (t.endonym) await a.switchLanguage(t.endonym);

      await expect(a.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(a.heading).toHaveText(t.heading);
      await expect(a.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      for (const col of t.columns) {
        await expect(a.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
      }
      await expect(a.page.getByRole('button', { name: t.export, exact: true })).toBeVisible();
    });
  }
});

// ─── BULGU 1: "Full Export" butonu ÇEVRİLMİYOR (4 dilde İngilizce) ───
test.describe('Denetim Günlüğü — çeviri sızıntısı: Full Export (bilinen hata) @i18n @known-bug', () => {
  test('"Full Export" butonu Türkçede çevrili olmalı (şu an İngilizce)', async ({ app }) => {
    test.fail(true, 'Bulgu: "Full Export" butonu tr/fr/ar arayüzde İngilizce "Full Export" kalıyor.');
    const a = app.auditLog;
    await a.open();
    await a.switchLanguage(I18N.tr.endonym);
    // Beklenen (doğru davranış): Türkçe arayüzde ham İngilizce "Full Export" GÖRÜNMEMELİ.
    await expect(a.page.getByRole('button', { name: 'Full Export', exact: true })).toHaveCount(0);
  });
});

// ─── BULGU 2: "Change details" dialogu "Close" (X) butonu ÇEVRİLMİYOR (sistemik) ───
test.describe('Denetim Günlüğü — çeviri sızıntısı: Close (bilinen hata) @i18n @known-bug', () => {
  test('View dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")', async ({ app }) => {
    test.fail(true, 'Bulgu: dialog kapat butonunun erişilebilir ismi 4 dilde de İngilizce "Close" kalıyor.');
    const a = app.auditLog;
    await a.open();
    await a.switchLanguage(I18N.tr.endonym);
    // tr'de "View" = "Görüntüle"
    const dialog = a.page.getByRole('dialog');
    await expect(async () => {
      await a.page.getByRole('button', { name: I18N.tr.view, exact: true }).first().click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(dialog.getByRole('button', { name: 'Kapat', exact: true })).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Denetim Günlüğü — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const a = app.auditLog;
    await a.open();
    await expectNoSevereA11y(a.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Denetim Günlüğü — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/audit');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Denetim Günlüğü — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const a = app.auditLog;
    await a.open();
    await waitForUiToSettle(a.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Denetim Günlüğü — hata-yolu @errorpath', () => {
  test('audit-logs ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.logs}**`, { status: 500 });
    const a = app.auditLog;
    await page.goto('/settings/audit', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(a.shell.loginHeading).toBeHidden();
    await expect(a.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Denetim Günlüğü — klavye/odak @keyboard', () => {
  test('View dialogu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const a = app.auditLog;
    await a.open();
    const dialog = await a.openViewDialog();
    await expectDialogKeyboard(a.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Denetim Günlüğü — deep-link @deeplink', () => {
  test('/settings/audit doğrudan açılınca log yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const a = app.auditLog;
    await page.goto('/settings/audit', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(a.shell.loginHeading).toBeHidden();
    await expect(a.heading).toHaveText(I18N.en.heading);
  });
});

// GÖRSEL REGRESYON — N/A (tested-pages naStyles): tablo canlı log verisi (timestamp/UUID/IP)
// içerir → kararlı snapshot bölgesi yok.
