// @ts-check
import { test, expect } from './fixtures/test.js';
import { ChannelEmailPage } from './pages/ChannelEmailPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
  knownBugGuard,
} from './helpers.js';

/**
 * KANALLAR › EMAIL (`/channels/email`)
 * Keşif + kanıt: docs/kanallar-kesif/NOTLAR.md (31 Tem 2026, app.vomenta.com).
 * Add Account (dialog), imza textarea, Save Changes. Canlı: "No email account connected".
 * BİLİNEN HATA B17: açılışta FORMATTING_ERROR (varsayılan imza `<p>...</p>`).
 * GÜVENLİK (production salt-okunur): Add Account / Save Changes ASLA gönderilmez.
 */
const I18N = ChannelEmailPage.I18N;
const API = ChannelEmailPage.API;

test.describe('E-posta — yapı', () => {
  test('sayfa "Email Channel" + Add Account + Save Changes ile açılıyor @smoke', async ({ app }) => {
    const c = app.channelEmail;
    await c.open();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
    await expect(c.page.getByText(I18N.en.subtitle, { exact: false }).first()).toBeVisible();
    await expect(c.addAccountButton).toBeVisible();
    await expect(c.saveButton).toBeVisible();
  });
});

test.describe('E-posta — veri sadakati @data', () => {
  test('GET /channels/email/config çağrılıyor', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes(API.config) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.channelEmail.open();
    await resP;
  });
});

// 3 KATMAN: Add Account dialogu (L1 tıklama OK)
test.describe('E-posta — Add Account dialogu @regression', () => {
  test('L1 tıklama OK: dialog açılıyor', async ({ app }) => {
    const c = app.channelEmail;
    await c.open();
    const dialog = await c.openAddAccountDialog();
    await expect(dialog).toBeVisible();
    await c.page.keyboard.press('Escape');
  });
});

test.describe("E-posta — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık çevrili`, async ({ app }) => {
      const c = app.channelEmail;
      await c.open();
      if (t.endonym) await c.switchLanguage(t.endonym);
      await expect(c.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(c.page.getByRole('heading', { name: t.heading, exact: true })).toBeVisible();
      await expect(c.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
    });
  }
});

// @a11y — B21 bilinen hata: form alanı erişilebilir etiket taşımıyor (axe label/critical).
test.describe('E-posta — erişilebilirlik @a11y @known-bug', () => {
  test('B21 · /channels/email · form alanları erişilebilir etiket taşımalı (label)', async ({ app }) => {
    knownBugGuard(test, 'B21');
    const c = app.channelEmail;
    await c.open();
    await waitForUiToSettle(c.page);
    await expect(c.page.locator('main input, main textarea').first()).toBeAttached();
    await expectNoSevereA11y(c.page);
  });
});

test.describe('E-posta — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/channels/email');
  });
});

// ═══════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) — B17 bilinen hata ═══════════
test.describe('E-posta — console/ağ temizliği @clean @known-bug', () => {
  test('B17 · /channels/email · açılışta imza format hatası (FORMATTING_ERROR) olmamalı', async ({ app, diagnostics }) => {
    knownBugGuard(test, 'B17'); // AÇIK: intl FORMATTING_ERROR (varsayılan imza <p>...</p>)
    await app.channelEmail.open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('E-posta — klavye/odak @keyboard', () => {
  test('Add Account dialogu odak tuzağı + Escape ile kapanma', async ({ app }) => {
    const c = app.channelEmail;
    await c.open();
    const dialog = await c.openAddAccountDialog();
    await expectDialogKeyboard(c.page, dialog);
  });
});

test.describe('E-posta — hata-yolu @errorpath', () => {
  test('config 500 dönse de kabuk + başlık sağlam', async ({ app, page }) => {
    await mockApi(page, `**${API.config}**`, { status: 500 });
    const c = app.channelEmail;
    await page.goto('/channels/email', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('E-posta — deep-link @deeplink', () => {
  test('/channels/email doğrudan açılınca yükleniyor', async ({ app, page }) => {
    const c = app.channelEmail;
    await page.goto('/channels/email', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
  });
});
