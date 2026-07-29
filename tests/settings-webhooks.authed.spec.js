// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { WebhooksPage } from './pages/WebhooksPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * AYARLAR › WEBHOOKS (`/settings/webhooks`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): Add Webhook / Add ASLA gönderilmez. Dialog yalnızca AÇILIR.
 */

const I18N = WebhooksPage.I18N;
const API = WebhooksPage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Webhooks — yapı', () => {
  test('sayfa başlığı + Add Webhook + boş-durum ile açılıyor @smoke', async ({ app }) => {
    const w = app.webhooks;
    await w.open();
    await expect(w.heading).toHaveText(I18N.en.heading);
    await expect(w.addButton).toBeVisible();
    await expect(w.page.getByText(I18N.en.empty, { exact: false }).first()).toBeVisible();
  });
});

// ──────────── 3 KATMAN: ADD WEBHOOK DIALOG (L1) (@regression) ────────────
test.describe('Webhooks — Add Webhook dialogu @regression', () => {
  test('L1 tıklama OK: dialog açılıyor (URL + Events + Create webhook disabled)', async ({ app }) => {
    const w = app.webhooks;
    await w.open();
    const dialog = await w.openAddDialog();
    await expect(dialog.getByRole('heading', { name: I18N.en.dialogTitle, exact: true })).toBeVisible();
    // NOT: URL textbox'ının erişilebilir adı yok (placeholder ile) → placeholder ile hedefle.
    await expect(dialog.getByPlaceholder('https://example.com/webhook')).toBeVisible();
    // Event checkbox'ları isimsiz; en az bir olay etiketi + checkbox var.
    await expect(dialog.getByText('call.started', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Create webhook', exact: true })).toBeDisabled();
    await w.page.keyboard.press('Escape');
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
// NOT: Başlık "Webhooks" 4 dilde de aynı (marka/teknik terim → sızıntı değil); alt başlık çevrili.
test.describe("Webhooks — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + Add Webhook çevrili`, async ({ app }) => {
      const w = app.webhooks;
      await w.open();
      if (t.endonym) await w.switchLanguage(t.endonym);

      await expect(w.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(w.heading).toHaveText(t.heading);
      await expect(w.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      await expect(w.page.getByRole('button', { name: t.add, exact: true }).first()).toBeVisible();
    });
  }
});

// ─── BULGU: Add Webhook dialogu "Close" (X) butonu ÇEVRİLMİYOR (sistemik sızıntı) ───
test.describe('Webhooks — çeviri sızıntısı (bilinen hata) @i18n @known-bug', () => {
  test('Add Webhook dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")', async ({ app }) => {
    test.fail(true, 'Bulgu: dialog kapat butonunun erişilebilir ismi 4 dilde de İngilizce "Close" kalıyor.');
    const w = app.webhooks;
    await w.open();
    await w.switchLanguage(I18N.tr.endonym);
    await expect(async () => {
      await w.page.getByRole('button', { name: I18N.tr.add, exact: true }).first().click();
      await expect(w.page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(w.page.getByRole('dialog').getByRole('button', { name: 'Kapat', exact: true })).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Webhooks — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const w = app.webhooks;
    await w.open();
    await expectNoSevereA11y(w.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Webhooks — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/webhooks');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Webhooks — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const w = app.webhooks;
    await w.open();
    await waitForUiToSettle(w.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Webhooks — hata-yolu @errorpath', () => {
  test('webhooks ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.webhooks}**`, { status: 500 });
    const w = app.webhooks;
    await page.goto('/settings/webhooks', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(w.shell.loginHeading).toBeHidden();
    await expect(w.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Webhooks — klavye/odak @keyboard', () => {
  test('Add Webhook dialogu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const w = app.webhooks;
    await w.open();
    const dialog = await w.openAddDialog();
    await expectDialogKeyboard(w.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Webhooks — deep-link @deeplink', () => {
  test('/settings/webhooks doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const w = app.webhooks;
    await page.goto('/settings/webhooks', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(w.shell.loginHeading).toBeHidden();
    await expect(w.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
test.describe('Webhooks — görsel @visual', () => {
  test('Add Webhook dialogu görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const w = app.webhooks;
    await w.open();
    const dialog = await w.openAddDialog();
    await waitForUiToSettle(w.page);
    await expect(dialog).toHaveScreenshot('webhooks-add-dialog.png', { maxDiffPixels: 300 });
  });
});
