// @ts-check
import { test, expect } from '../fixtures/test.js';
import { ChannelSmsPage } from '../pages/ChannelSmsPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
  knownBugGuard,
} from '../helpers.js';

/**
 * KANALLAR › SMS (`/channels/sms`)
 * Keşif + kanıt: docs/kanallar-kesif/NOTLAR.md (31 Tem 2026, app.vomenta.com).
 * Send SMS / Add Sender / Create Template / Transceiver (SMPP) / Save & Test / Save Changes.
 * BİLİNEN HATA B18: açılışta INVALID_MESSAGE MALFORMED_ARGUMENT.
 * GÜVENLİK (production salt-okunur): hiçbir gönderim yapılmaz.
 */
const I18N = ChannelSmsPage.I18N;
const API = ChannelSmsPage.API;

test.describe('SMS — yapı', () => {
  test('sayfa "SMS Configuration" + Send SMS + Add Sender + Save Changes ile açılıyor @smoke', async ({ app }) => {
    const c = app.channelSms;
    await c.open();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
    await expect(c.page.getByText(I18N.en.subtitle, { exact: false }).first()).toBeVisible();
    await expect(c.sendSmsButton).toBeVisible();
    await expect(c.addSenderButton).toBeVisible();
    await expect(c.saveButton).toBeVisible();
  });
});

test.describe('SMS — veri sadakati @data', () => {
  test('GET /channels/sms/config çağrılıyor', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes(API.config) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.channelSms.open();
    await resP;
  });
});

// 3 KATMAN: Add Sender dialogu (L1 tıklama OK)
test.describe('SMS — Add Sender dialogu @regression', () => {
  test('L1 tıklama OK: dialog açılıyor', async ({ app }) => {
    const c = app.channelSms;
    await c.open();
    const dialog = await c.openAddSenderDialog();
    await expect(dialog).toBeVisible();
    await c.page.keyboard.press('Escape');
  });
});

test.describe("SMS — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık çevrili`, async ({ app }) => {
      const c = app.channelSms;
      await c.open();
      if (t.endonym) await c.switchLanguage(t.endonym);
      await expect(c.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(c.page.getByRole('heading', { name: t.heading, exact: true })).toBeVisible();
      await expect(c.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
    });
  }
});

// @a11y — B22 bilinen hata: form alanları erişilebilir etiket taşımıyor (axe label/critical).
test.describe('SMS — erişilebilirlik @a11y @known-bug', () => {
  test('B22 · /channels/sms · form alanları erişilebilir etiket taşımalı (label)', async ({ app }) => {
    knownBugGuard(test, 'B22');
    const c = app.channelSms;
    await c.open();
    await waitForUiToSettle(c.page);
    await expect(c.page.locator('main input, main textarea').first()).toBeAttached();
    await expectNoSevereA11y(c.page);
  });
});

test.describe('SMS — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/channels/sms');
  });
});

// ═══════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) — B18 bilinen hata ═══════════
test.describe('SMS — console/ağ temizliği @clean @known-bug', () => {
  test('B18 · /channels/sms · açılışta MALFORMED_ARGUMENT konsol hatası olmamalı', async ({ app, diagnostics }) => {
    knownBugGuard(test, 'B18'); // AÇIK: INVALID_MESSAGE MALFORMED_ARGUMENT
    await app.channelSms.open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('SMS — klavye/odak @keyboard', () => {
  test('Add Sender dialogu odak tuzağı + Escape ile kapanma', async ({ app }) => {
    const c = app.channelSms;
    await c.open();
    const dialog = await c.openAddSenderDialog();
    await expectDialogKeyboard(c.page, dialog);
  });
});

test.describe('SMS — hata-yolu @errorpath', () => {
  test('config 500 dönse de kabuk + başlık sağlam', async ({ app, page }) => {
    await mockApi(page, `**${API.config}**`, { status: 500 });
    const c = app.channelSms;
    await page.goto('/channels/sms', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('SMS — deep-link @deeplink', () => {
  test('/channels/sms doğrudan açılınca yükleniyor', async ({ app, page }) => {
    const c = app.channelSms;
    await page.goto('/channels/sms', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
  });
});
