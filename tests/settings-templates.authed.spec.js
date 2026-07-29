// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { TemplatesPage } from './pages/TemplatesPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * AYARLAR › ŞABLONLAR (`/settings/templates`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): New Template / Create ASLA gönderilmez. Dialog yalnızca AÇILIR.
 */

const I18N = TemplatesPage.I18N;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Şablonlar — yapı', () => {
  test('sayfa başlığı + üst sekmeler + New Template ile açılıyor @smoke', async ({ app }) => {
    const t = app.templates;
    await t.open();
    await expect(t.heading).toHaveText(I18N.en.heading);
    for (const name of I18N.en.topTabs) await expect(t.topTab(name)).toBeVisible();
    await expect(t.newTemplateButton).toBeVisible();
  });

  test('şablon tablosu kolonları + boş-durum @critical', async ({ app }) => {
    const t = app.templates;
    await t.open();
    for (const col of I18N.en.columns) {
      await expect(t.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }
    await expect(t.page.getByText(I18N.en.empty, { exact: false }).first()).toBeVisible();
  });
});

// ──────────── 3 KATMAN: ÜST SEKMELER + NEW TEMPLATE DIALOG (@regression) ────────────
test.describe('Şablonlar — sekmeler + New Template @regression', () => {
  test('L1: üst sekmeler tıklanınca aria-selected=true', async ({ app }) => {
    const t = app.templates;
    await t.open();
    for (const name of I18N.en.topTabs) {
      const tab = t.topTab(name);
      await expect(async () => {
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
      }).toPass({ timeout: 15000 });
    }
  });

  test('L1: New Template dialogu açılıyor (Name + Create disabled)', async ({ app }) => {
    const t = app.templates;
    await t.open();
    const dialog = await t.openNewTemplateDialog();
    await expect(dialog.getByRole('heading', { name: I18N.en.dialogTitle, exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Create', exact: true })).toBeDisabled();
    await t.page.keyboard.press('Escape');
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Şablonlar — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + üst sekmeler + New Template çevrili`, async ({ app }) => {
      const tp = app.templates;
      await tp.open();
      if (t.endonym) await tp.switchLanguage(t.endonym);

      await expect(tp.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(tp.heading).toHaveText(t.heading);
      await expect(tp.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      for (const name of t.topTabs) await expect(tp.topTab(name)).toBeVisible();
      await expect(tp.page.getByRole('button', { name: t.newTemplate, exact: true })).toBeVisible();
    });
  }
});

// ─── BULGU 1: New Template içerik placeholder'ı HAM i18n ANAHTARI (çeviri sızıntısı) ───
test.describe('Şablonlar — çeviri sızıntısı: içerik placeholder (bilinen hata) @i18n @known-bug', () => {
  test('içerik alanı placeholder\'ı ham anahtar "settings.templatesPage.contentPlaceholder" GÖSTERMEMELİ', async ({ app }) => {
    test.fail(true, 'Bulgu: New Template içerik textarea placeholder\'ı çevrilmemiş ham i18n anahtarı.');
    const t = app.templates;
    await t.open();
    const dialog = await t.openNewTemplateDialog();
    // Beklenen (doğru davranış): placeholder ham anahtar OLMAMALI → guard kırmızı kalır.
    await expect(dialog.getByPlaceholder('settings.templatesPage.contentPlaceholder')).toHaveCount(0);
  });
});

// ─── BULGU 2: dialog "Close" (X) butonu ÇEVRİLMİYOR (sistemik sızıntı) ───
test.describe('Şablonlar — çeviri sızıntısı: Close (bilinen hata) @i18n @known-bug', () => {
  test('New Template dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")', async ({ app }) => {
    test.fail(true, 'Bulgu: dialog kapat butonunun erişilebilir ismi 4 dilde de İngilizce "Close" kalıyor.');
    const t = app.templates;
    await t.open();
    await t.switchLanguage(I18N.tr.endonym);
    await expect(async () => {
      await t.page.getByRole('button', { name: I18N.tr.newTemplate, exact: true }).click();
      await expect(t.page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(t.page.getByRole('dialog').getByRole('button', { name: 'Kapat', exact: true })).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Şablonlar — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const t = app.templates;
    await t.open();
    await expectNoSevereA11y(t.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Şablonlar — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/templates');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Şablonlar — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const t = app.templates;
    await t.open();
    await waitForUiToSettle(t.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Şablonlar — hata-yolu @errorpath', () => {
  test('şablon ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, '**/api/v1/templates**', { status: 500 });
    const t = app.templates;
    await page.goto('/settings/templates', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(t.shell.loginHeading).toBeHidden();
    await expect(t.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Şablonlar — klavye/odak @keyboard', () => {
  test('New Template dialogu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const t = app.templates;
    await t.open();
    const dialog = await t.openNewTemplateDialog();
    await expectDialogKeyboard(t.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Şablonlar — deep-link @deeplink', () => {
  test('/settings/templates doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const t = app.templates;
    await page.goto('/settings/templates', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(t.shell.loginHeading).toBeHidden();
    await expect(t.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
test.describe('Şablonlar — görsel @visual', () => {
  test('New Template dialogu görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const t = app.templates;
    await t.open();
    const dialog = await t.openNewTemplateDialog();
    await waitForUiToSettle(t.page);
    await expect(dialog).toHaveScreenshot('templates-new-dialog.png', { maxDiffPixels: 250 });
  });
});
