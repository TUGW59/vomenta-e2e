// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { ChannelVideoPage } from './pages/ChannelVideoPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
  knownBugGuard,
} from './helpers.js';

/**
 * KANALLAR › VIDEO (`/channels/video`)
 * Keşif + kanıt: docs/kanallar-kesif/NOTLAR.md (31 Tem 2026, app.vomenta.com).
 * Kalite/fps seçicileri, Save Changes, Start Video Call. Canlı açılış konsolu temiz.
 * GÜVENLİK (production salt-okunur): Save Changes / Start Video Call ASLA tetiklenmez.
 */
const I18N = ChannelVideoPage.I18N;
const API = ChannelVideoPage.API;

test.describe('Video — yapı', () => {
  test('sayfa "Video Call Configuration" + Save Changes ile açılıyor @smoke', async ({ app }) => {
    const c = app.channelVideo;
    await c.open();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
    await expect(c.page.getByText(I18N.en.subtitle, { exact: false }).first()).toBeVisible();
    await expect(c.saveButton).toBeVisible();
  });
});

test.describe('Video — veri sadakati @data', () => {
  test('GET /channels/video/config çağrılıyor', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes(API.config) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.channelVideo.open();
    await resP;
  });
});

test.describe("Video — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık çevrili`, async ({ app }) => {
      const c = app.channelVideo;
      await c.open();
      if (t.endonym) await c.switchLanguage(t.endonym);
      await expect(c.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(c.page.getByRole('heading', { name: t.heading, exact: true })).toBeVisible();
      await expect(c.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
    });
  }
});

// @a11y — B25 bilinen hata: form alanları erişilebilir etiket taşımıyor (axe label/critical).
test.describe('Video — erişilebilirlik @a11y @known-bug', () => {
  test('B25 · /channels/video · form alanları erişilebilir etiket taşımalı (label)', async ({ app }) => {
    knownBugGuard(test, 'B25');
    const c = app.channelVideo;
    await c.open();
    await waitForUiToSettle(c.page);
    await expect(c.page.locator('main input, main textarea').first()).toBeAttached();
    await expectNoSevereA11y(c.page);
  });
});

test.describe('Video — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/channels/video');
  });
});

test.describe('Video — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    await app.channelVideo.open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('Video — hata-yolu @errorpath', () => {
  test('config 500 dönse de kabuk + başlık sağlam', async ({ app, page }) => {
    await mockApi(page, `**${API.config}**`, { status: 500 });
    const c = app.channelVideo;
    await page.goto('/channels/video', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Video — deep-link @deeplink', () => {
  test('/channels/video doğrudan açılınca yükleniyor', async ({ app, page }) => {
    const c = app.channelVideo;
    await page.goto('/channels/video', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Video — görsel @visual', () => {
  test('yapılandırma formu görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const c = app.channelVideo;
    await c.open();
    await waitForUiToSettle(c.page);
    await expect(c.page.locator('main')).toHaveScreenshot('channels-video.png', { maxDiffPixels: 400 });
  });
});
