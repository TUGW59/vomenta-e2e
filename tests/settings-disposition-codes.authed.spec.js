// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { DispositionCodesPage } from './pages/DispositionCodesPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * AYARLAR › SONUÇ KODLARI (`/settings/disposition-codes`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): Add Code / Create / satır sil ASLA gönderilmez.
 */

const I18N = DispositionCodesPage.I18N;
const API = DispositionCodesPage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Sonuç Kodları — yapı', () => {
  test('sayfa başlığı + Add Code + tablo ile açılıyor @smoke', async ({ app }) => {
    const d = app.dispositionCodes;
    await d.open();
    await expect(d.heading).toHaveText(I18N.en.heading);
    await expect(d.addButton).toBeVisible();
    await expect(d.table).toBeVisible();
  });

  test('tablo kolonları + bilinen kodlar (SALE/NO_ANSWER) görünüyor @critical', async ({ app }) => {
    const d = app.dispositionCodes;
    await d.open();
    for (const col of I18N.en.columns) {
      await expect(d.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }
    await expect(d.rows.filter({ hasText: 'SALE' }).first()).toBeVisible();
    await expect(d.rows.filter({ hasText: 'NO_ANSWER' }).first()).toBeVisible();
  });
});

// ──────────── 3 KATMAN: ADD CODE DIALOG (L1) (@regression) ────────────
test.describe('Sonuç Kodları — Add Code dialogu @regression', () => {
  test('L1 tıklama OK: dialog açılıyor (Code/Label alanları + Create)', async ({ app }) => {
    const d = app.dispositionCodes;
    await d.open();
    const dialog = await d.openAddDialog();
    await expect(dialog.getByRole('heading', { name: I18N.en.dialogTitle, exact: true })).toBeVisible();
    await expect(dialog.getByRole('textbox').first()).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Create', exact: true })).toBeVisible();
    await d.page.keyboard.press('Escape');
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Sonuç Kodları — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + kolonlar + Add çevrili`, async ({ app }) => {
      const d = app.dispositionCodes;
      await d.open();
      if (t.endonym) await d.switchLanguage(t.endonym);

      await expect(d.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(d.heading).toHaveText(t.heading);
      await expect(d.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      for (const col of t.columns) {
        await expect(d.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
      }
      await expect(d.page.getByRole('button', { name: t.add, exact: true })).toBeVisible();
    });
  }
});

// ─── BULGU: Add Code dialogu "Close" (X) butonu ÇEVRİLMİYOR (sistemik sızıntı) ───
test.describe('Sonuç Kodları — çeviri sızıntısı (bilinen hata) @i18n @known-bug', () => {
  test('Add Code dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")', async ({ app }) => {
    test.fail(true, 'Bulgu: dialog kapat butonunun erişilebilir ismi 4 dilde de İngilizce "Close" kalıyor.');
    const d = app.dispositionCodes;
    await d.open();
    await d.switchLanguage(I18N.tr.endonym);
    await expect(async () => {
      await d.page.getByRole('button', { name: I18N.tr.add, exact: true }).click();
      await expect(d.page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(d.page.getByRole('dialog').getByRole('button', { name: 'Kapat', exact: true })).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Sonuç Kodları — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const d = app.dispositionCodes;
    await d.open();
    await expectNoSevereA11y(d.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Sonuç Kodları — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/disposition-codes');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Sonuç Kodları — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const d = app.dispositionCodes;
    await d.open();
    await waitForUiToSettle(d.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Sonuç Kodları — hata-yolu @errorpath', () => {
  test('kod ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.codes}**`, { status: 500 });
    const d = app.dispositionCodes;
    await page.goto('/settings/disposition-codes', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(d.shell.loginHeading).toBeHidden();
    await expect(d.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Sonuç Kodları — klavye/odak @keyboard', () => {
  test('Add Code dialogu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const d = app.dispositionCodes;
    await d.open();
    const dialog = await d.openAddDialog();
    await expectDialogKeyboard(d.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Sonuç Kodları — deep-link @deeplink', () => {
  test('/settings/disposition-codes doğrudan açılınca liste yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const d = app.dispositionCodes;
    await page.goto('/settings/disposition-codes', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(d.shell.loginHeading).toBeHidden();
    await expect(d.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
test.describe('Sonuç Kodları — görsel @visual', () => {
  test('Add Code dialogu görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const d = app.dispositionCodes;
    await d.open();
    const dialog = await d.openAddDialog();
    await waitForUiToSettle(d.page);
    await expect(dialog).toHaveScreenshot('disposition-add-dialog.png', { maxDiffPixels: 250 });
  });
});
