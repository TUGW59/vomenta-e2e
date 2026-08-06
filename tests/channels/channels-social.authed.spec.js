// @ts-check
import { test, expect } from '../fixtures/test.js';
import { ChannelSocialPage } from '../pages/ChannelSocialPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
  knownBugGuard,
} from '../helpers.js';

/**
 * KANALLAR › SOCIAL MEDIA (`/channels/social`)
 * Keşif + kanıt: docs/kanallar-kesif/NOTLAR.md (31 Tem 2026, app.vomenta.com).
 * 6 platform kartı + Connect; Save Changes.
 * BİLİNEN HATA B16: açılışta MISSING_MESSAGE channels.socialPage.platformNames (en).
 * GÜVENLİK (production salt-okunur): Connect / Save Changes ASLA gönderilmez.
 */
const I18N = ChannelSocialPage.I18N;
const API = ChannelSocialPage.API;

test.describe('Sosyal Medya — yapı', () => {
  test('sayfa "Social Media Channels" + Connect + Save Changes ile açılıyor @smoke', async ({ app }) => {
    const c = app.channelSocial;
    await c.open();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
    await expect(c.page.getByText(I18N.en.subtitle, { exact: false }).first()).toBeVisible();
    await expect(c.connectButtons.first()).toBeVisible();
    await expect(c.saveButton).toBeVisible();
  });
});

test.describe('Sosyal Medya — veri sadakati @data', () => {
  test('GET /channels/social/config çağrılıyor', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes(API.config) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.channelSocial.open();
    await resP;
  });
});

test.describe("Sosyal Medya — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık çevrili`, async ({ app }) => {
      const c = app.channelSocial;
      await c.open();
      if (t.endonym) await c.switchLanguage(t.endonym);
      await expect(c.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(c.page.getByRole('heading', { name: t.heading, exact: true })).toBeVisible();
      await expect(c.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
    });
  }
});

// @a11y — B24 bilinen hata: form alanları erişilebilir etiket taşımıyor (axe label/critical).
test.describe('Sosyal Medya — erişilebilirlik @a11y @known-bug', () => {
  test('B24 · /channels/social · form alanları erişilebilir etiket taşımalı (label)', async ({ app }) => {
    knownBugGuard(test, 'B24');
    const c = app.channelSocial;
    await c.open();
    await waitForUiToSettle(c.page);
    await expect(c.page.locator('main input, main textarea').first()).toBeAttached();
    await expectNoSevereA11y(c.page);
  });
});

test.describe('Sosyal Medya — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/channels/social');
  });
});

// ═══════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) — B16 bilinen hata ═══════════
test.describe('Sosyal Medya — console/ağ temizliği @clean @known-bug', () => {
  test('B16 · /channels/social · açılışta eksik çeviri (MISSING_MESSAGE) konsol hatası olmamalı', async ({ app, diagnostics }) => {
    knownBugGuard(test, 'B16'); // AÇIK: MISSING_MESSAGE channels.socialPage.platformNames (en)
    await app.channelSocial.open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('Sosyal Medya — hata-yolu @errorpath', () => {
  test('config 500 dönse de kabuk + başlık sağlam', async ({ app, page }) => {
    await mockApi(page, `**${API.config}**`, { status: 500 });
    const c = app.channelSocial;
    await page.goto('/channels/social', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Sosyal Medya — deep-link @deeplink', () => {
  test('/channels/social doğrudan açılınca yükleniyor', async ({ app, page }) => {
    const c = app.channelSocial;
    await page.goto('/channels/social', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
  });
});
