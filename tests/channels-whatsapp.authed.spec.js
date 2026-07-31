// @ts-check
import { test, expect } from './fixtures/test.js';
import { ChannelWhatsappPage } from './pages/ChannelWhatsappPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
  knownBugGuard,
} from './helpers.js';

/**
 * KANALLAR › WHATSAPP (`/channels/whatsapp`)
 * Keşif + kanıt: docs/kanallar-kesif/NOTLAR.md (31 Tem 2026, app.vomenta.com).
 * Canlı: "WhatsApp Business API Not Configured" + "No templates yet". Save Changes.
 * BİLİNEN HATA B19: açılışta INVALID_MESSAGE MALFORMED_ARGUMENT.
 * GÜVENLİK (production salt-okunur): Configure / Create Template / Save ASLA gönderilmez.
 */
const I18N = ChannelWhatsappPage.I18N;
const API = ChannelWhatsappPage.API;

test.describe('WhatsApp — yapı', () => {
  test('sayfa "WhatsApp Business" + Save Changes ile açılıyor @smoke', async ({ app }) => {
    const c = app.channelWhatsapp;
    await c.open();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
    await expect(c.page.getByText(I18N.en.subtitle, { exact: false }).first()).toBeVisible();
    await expect(c.saveButton).toBeVisible();
  });
});

test.describe('WhatsApp — veri sadakati @data', () => {
  test('GET /channels/whatsapp/config çağrılıyor', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes(API.config) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.channelWhatsapp.open();
    await resP;
  });
});

test.describe("WhatsApp — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık çevrili`, async ({ app }) => {
      const c = app.channelWhatsapp;
      await c.open();
      if (t.endonym) await c.switchLanguage(t.endonym);
      await expect(c.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(c.page.getByRole('heading', { name: t.heading, exact: true }).first()).toBeVisible();
      await expect(c.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
    });
  }
});

// @a11y — B23 bilinen hata: form alanları erişilebilir etiket taşımıyor (axe label/critical).
test.describe('WhatsApp — erişilebilirlik @a11y @known-bug', () => {
  test('B23 · /channels/whatsapp · form alanları erişilebilir etiket taşımalı (label)', async ({ app }) => {
    knownBugGuard(test, 'B23');
    const c = app.channelWhatsapp;
    await c.open();
    await waitForUiToSettle(c.page);
    await expect(c.page.locator('main input, main textarea').first()).toBeAttached();
    await expectNoSevereA11y(c.page);
  });
});

test.describe('WhatsApp — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/channels/whatsapp');
  });
});

// ═══════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) — B19 bilinen hata ═══════════
test.describe('WhatsApp — console/ağ temizliği @clean @known-bug', () => {
  test('B19 · /channels/whatsapp · açılışta MALFORMED_ARGUMENT konsol hatası olmamalı', async ({ app, diagnostics }) => {
    knownBugGuard(test, 'B19'); // AÇIK: INVALID_MESSAGE MALFORMED_ARGUMENT
    await app.channelWhatsapp.open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('WhatsApp — hata-yolu @errorpath', () => {
  test('config 500 dönse de kabuk + başlık sağlam', async ({ app, page }) => {
    await mockApi(page, `**${API.config}**`, { status: 500 });
    const c = app.channelWhatsapp;
    await page.goto('/channels/whatsapp', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('WhatsApp — deep-link @deeplink', () => {
  test('/channels/whatsapp doğrudan açılınca yükleniyor', async ({ app, page }) => {
    const c = app.channelWhatsapp;
    await page.goto('/channels/whatsapp', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
  });
});
