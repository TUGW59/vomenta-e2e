// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { CannedResponsesPage } from './pages/CannedResponsesPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * AYARLAR › HAZIR YANITLAR (`/settings/canned-responses`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): New canned response / Create ASLA gönderilmez.
 */

const I18N = CannedResponsesPage.I18N;
const API = CannedResponsesPage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Hazır Yanıtlar — yapı', () => {
  test('sayfa başlığı + New canned response + tablo/boş-durum ile açılıyor @smoke', async ({ app }) => {
    const c = app.cannedResponses;
    await c.open();
    await expect(c.heading).toHaveText(I18N.en.heading);
    await expect(c.createButton).toBeVisible();
    await expect(c.page.getByText(I18N.en.empty, { exact: false }).first()).toBeVisible();
  });

  test('tablo kolonları görünüyor @critical', async ({ app }) => {
    const c = app.cannedResponses;
    await c.open();
    for (const col of I18N.en.columns) {
      await expect(c.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }
  });
});

// ──────────── 3 KATMAN: CREATE DIALOG (L1) (@regression) ────────────
test.describe('Hazır Yanıtlar — Create dialogu @regression', () => {
  test('L1 tıklama OK: dialog açılıyor (Title/Shortcode + Create disabled)', async ({ app }) => {
    const c = app.cannedResponses;
    await c.open();
    const dialog = await c.openCreateDialog();
    await expect(dialog.getByRole('heading', { name: I18N.en.dialogTitle, exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Create', exact: true })).toBeDisabled();
    await c.page.keyboard.press('Escape');
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Hazır Yanıtlar — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + kolonlar + New çevrili`, async ({ app }) => {
      const c = app.cannedResponses;
      await c.open();
      if (t.endonym) await c.switchLanguage(t.endonym);

      await expect(c.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(c.heading).toHaveText(t.heading);
      await expect(c.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      for (const col of t.columns) {
        await expect(c.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
      }
      await expect(c.page.getByRole('button', { name: t.create, exact: true })).toBeVisible();
    });
  }
});

// ─── BULGU: Create dialogu "Close" (X) butonu ÇEVRİLMİYOR (sistemik sızıntı) ───
test.describe('Hazır Yanıtlar — çeviri sızıntısı (bilinen hata) @i18n @known-bug', () => {
  test('Create dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")', async ({ app }) => {
    test.fail(true, 'Bulgu: dialog kapat butonunun erişilebilir ismi 4 dilde de İngilizce "Close" kalıyor.');
    const c = app.cannedResponses;
    await c.open();
    await c.switchLanguage(I18N.tr.endonym);
    await expect(async () => {
      await c.page.getByRole('button', { name: I18N.tr.create, exact: true }).click();
      await expect(c.page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(c.page.getByRole('dialog').getByRole('button', { name: 'Kapat', exact: true })).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Hazır Yanıtlar — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const c = app.cannedResponses;
    await c.open();
    await expectNoSevereA11y(c.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Hazır Yanıtlar — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/canned-responses');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Hazır Yanıtlar — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const c = app.cannedResponses;
    await c.open();
    await waitForUiToSettle(c.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Hazır Yanıtlar — hata-yolu @errorpath', () => {
  test('canned ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.canned}**`, { status: 500 });
    const c = app.cannedResponses;
    await page.goto('/settings/canned-responses', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Hazır Yanıtlar — klavye/odak @keyboard', () => {
  test('Create dialogu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const c = app.cannedResponses;
    await c.open();
    const dialog = await c.openCreateDialog();
    await expectDialogKeyboard(c.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Hazır Yanıtlar — deep-link @deeplink', () => {
  test('/settings/canned-responses doğrudan açılınca liste yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const c = app.cannedResponses;
    await page.goto('/settings/canned-responses', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
test.describe('Hazır Yanıtlar — görsel @visual', () => {
  test('Create dialogu görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const c = app.cannedResponses;
    await c.open();
    const dialog = await c.openCreateDialog();
    await waitForUiToSettle(c.page);
    await expect(dialog).toHaveScreenshot('canned-create-dialog.png', { maxDiffPixels: 250 });
  });
});
