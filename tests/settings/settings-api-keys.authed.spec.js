// @ts-check
import { test, expect } from '../fixtures/test.js';
import { environment } from '../../config/environment.js';
import { ApiKeysPage } from '../pages/ApiKeysPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from '../helpers.js';

/**
 * AYARLAR › API ANAHTARLARI (`/settings/api-keys`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): Create Key / Generate / Create Key (submit) ASLA gönderilmez.
 */

const I18N = ApiKeysPage.I18N;
const API = ApiKeysPage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('API Anahtarları — yapı', () => {
  test('sayfa başlığı + Create Key + boş-durum ile açılıyor @smoke', async ({ app }) => {
    const a = app.apiKeys;
    await a.open();
    await expect(a.heading).toHaveText(I18N.en.heading);
    await expect(a.createButton).toBeVisible();
    await expect(a.page.getByText(I18N.en.empty, { exact: false }).first()).toBeVisible();
  });
});

// ──────────── 3 KATMAN: CREATE KEY DIALOG (L1) (@regression) ────────────
test.describe('API Anahtarları — Create Key dialogu @regression', () => {
  test('L1 tıklama OK: dialog açılıyor (Key name/Permissions + Create Key disabled)', async ({ app }) => {
    const a = app.apiKeys;
    await a.open();
    const dialog = await a.openCreateDialog();
    await expect(dialog.getByRole('heading', { name: I18N.en.dialogTitle, exact: true })).toBeVisible();
    await expect(dialog.getByRole('checkbox').first()).toBeVisible(); // Permissions
    await expect(dialog.getByRole('button', { name: 'Create Key', exact: true })).toBeDisabled();
    await a.page.keyboard.press('Escape');
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("API Anahtarları — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + Create/Generate çevrili`, async ({ app }) => {
      const a = app.apiKeys;
      await a.open();
      if (t.endonym) await a.switchLanguage(t.endonym);

      await expect(a.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(a.heading).toHaveText(t.heading);
      await expect(a.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      await expect(a.page.getByRole('button', { name: t.create, exact: true })).toBeVisible();
      await expect(a.page.getByRole('button', { name: t.generate, exact: true })).toBeVisible();
    });
  }
});

// ─── BULGU: Create Key dialogu "Close" (X) butonu ÇEVRİLMİYOR (sistemik sızıntı) ───
test.describe('API Anahtarları — çeviri sızıntısı (bilinen hata) @i18n @known-bug', () => {
  test('Create Key dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")', async ({ app }) => {
    test.fail(true, 'Bulgu: dialog kapat butonunun erişilebilir ismi 4 dilde de İngilizce "Close" kalıyor.');
    const a = app.apiKeys;
    await a.open();
    await a.switchLanguage(I18N.tr.endonym);
    await expect(async () => {
      await a.page.getByRole('button', { name: I18N.tr.create, exact: true }).click();
      await expect(a.page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(a.page.getByRole('dialog').getByRole('button', { name: 'Kapat', exact: true })).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('API Anahtarları — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const a = app.apiKeys;
    await a.open();
    await expectNoSevereA11y(a.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('API Anahtarları — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/api-keys');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('API Anahtarları — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const a = app.apiKeys;
    await a.open();
    await waitForUiToSettle(a.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('API Anahtarları — hata-yolu @errorpath', () => {
  test('api-keys ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.keys}**`, { status: 500 });
    const a = app.apiKeys;
    await page.goto('/settings/api-keys', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(a.shell.loginHeading).toBeHidden();
    await expect(a.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('API Anahtarları — klavye/odak @keyboard', () => {
  test('Create Key dialogu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const a = app.apiKeys;
    await a.open();
    const dialog = await a.openCreateDialog();
    await expectDialogKeyboard(a.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('API Anahtarları — deep-link @deeplink', () => {
  test('/settings/api-keys doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const a = app.apiKeys;
    await page.goto('/settings/api-keys', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(a.shell.loginHeading).toBeHidden();
    await expect(a.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
test.describe('API Anahtarları — görsel @visual', () => {
  test('Create Key dialogu görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const a = app.apiKeys;
    await a.open();
    const dialog = await a.openCreateDialog();
    await waitForUiToSettle(a.page);
    await expect(dialog).toHaveScreenshot('api-keys-create-dialog.png', { maxDiffPixels: 250 });
  });
});
