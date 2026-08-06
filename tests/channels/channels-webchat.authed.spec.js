// @ts-check
import { test, expect } from '../fixtures/test.js';
import { environment } from '../../config/environment.js';
import { ChannelWebchatPage } from '../pages/ChannelWebchatPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
  knownBugGuard,
} from '../helpers.js';

/**
 * KANALLAR › WEB CHAT (`/channels/webchat`)
 * Keşif + kanıt: docs/kanallar-kesif/NOTLAR.md (31 Tem 2026, app.vomenta.com).
 * İki sekme (Configuration / Integration), Save Changes, Preview Widget. Canlı: Connected.
 * GÜVENLİK (production salt-okunur): Save Changes ASLA gönderilmez.
 */
const I18N = ChannelWebchatPage.I18N;
const API = ChannelWebchatPage.API;

test.describe('Web Chat — yapı', () => {
  test('sayfa "Web Chat Configuration" + sekmeler + Save Changes ile açılıyor @smoke', async ({ app }) => {
    const c = app.channelWebchat;
    await c.open();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
    await expect(c.page.getByText(I18N.en.subtitle, { exact: false }).first()).toBeVisible();
    await expect(c.configurationTab).toBeVisible();
    await expect(c.integrationTab).toBeVisible();
    await expect(c.saveButton).toBeVisible();
  });
});

test.describe('Web Chat — veri sadakati @data', () => {
  test('GET /channels/webchat/config çağrılıyor', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes(API.config) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.channelWebchat.open();
    await resP;
  });
});

// 3 KATMAN: sekme geçişi (L1 tıklama + L3 içerik değişir)
test.describe('Web Chat — sekme geçişi @regression', () => {
  test('L1+L3: Integration sekmesine geçince aria-selected + gömme içeriği', async ({ app }) => {
    const c = app.channelWebchat;
    await c.open();
    await expect(async () => {
      await c.integrationTab.click();
      await expect(c.integrationTab).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(c.configurationTab).toHaveAttribute('aria-selected', 'false');
  });
});

test.describe("Web Chat — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık çevrili`, async ({ app }) => {
      const c = app.channelWebchat;
      await c.open();
      if (t.endonym) await c.switchLanguage(t.endonym);
      await expect(c.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(c.page.getByRole('heading', { name: t.heading, exact: true })).toBeVisible();
      await expect(c.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
    });
  }
});

// @a11y — B20 bilinen hata: form alanları erişilebilir etiket taşımıyor (axe label/critical).
test.describe('Web Chat — erişilebilirlik @a11y @known-bug', () => {
  test('B20 · /channels/webchat · form alanları erişilebilir etiket taşımalı (label)', async ({ app }) => {
    knownBugGuard(test, 'B20');
    const c = app.channelWebchat;
    await c.open();
    await waitForUiToSettle(c.page);
    await expect(c.page.locator('main input, main textarea').first()).toBeAttached();
    await expectNoSevereA11y(c.page);
  });
});

test.describe('Web Chat — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/channels/webchat');
  });
});

test.describe('Web Chat — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    await app.channelWebchat.open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('Web Chat — klavye/odak @keyboard', () => {
  test('sekmeler klavye ile gezilebilir (ArrowRight → Integration seçili)', async ({ app }) => {
    const c = app.channelWebchat;
    await c.open();
    await c.configurationTab.focus();
    await c.page.keyboard.press('ArrowRight');
    await expect(c.integrationTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
  });
});

test.describe('Web Chat — hata-yolu @errorpath', () => {
  test('config 500 dönse de kabuk + başlık sağlam', async ({ app, page }) => {
    await mockApi(page, `**${API.config}**`, { status: 500 });
    const c = app.channelWebchat;
    await page.goto('/channels/webchat', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Web Chat — deep-link @deeplink', () => {
  test('/channels/webchat doğrudan açılınca yükleniyor', async ({ app, page }) => {
    const c = app.channelWebchat;
    await page.goto('/channels/webchat', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Web Chat — görsel @visual', () => {
  test('yapılandırma sekmesi görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const c = app.channelWebchat;
    await c.open();
    await waitForUiToSettle(c.page);
    await expect(c.page.locator('main')).toHaveScreenshot('channels-webchat.png', { maxDiffPixels: 400 });
  });
});
