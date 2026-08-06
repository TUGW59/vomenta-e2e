// @ts-check
import { test, expect } from '../fixtures/test.js';
import { environment } from '../../config/environment.js';
import { ChannelsHubPage } from '../pages/ChannelsHubPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  assertDestinationLoaded,
  mockApi,
  waitForUiToSettle,
} from '../helpers.js';

/**
 * KANALLAR HUB (`/channels`)
 *
 * Keşif + kanıt: docs/kanallar-kesif/NOTLAR.md. Canlı gözlem: 31 Tem 2026, app.vomenta.com.
 * 7 kanal kartı + Configure bağlantıları. Hub salt gezinme (yazma yok).
 *
 * GÜVENLİK (production salt-okunur): yalnız okuma + gezinme.
 */

const I18N = ChannelsHubPage.I18N;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Kanallar hub — yapı', () => {
  test('sayfa "Channels" başlığı + 7 kanal kartı + Configure bağlantıları ile açılıyor @smoke', async ({ app }) => {
    const c = app.channelsHub;
    await c.open();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
    await expect(c.page.getByText(I18N.en.subtitle, { exact: false }).first()).toBeVisible();
    for (const title of ChannelsHubPage.CARDS) {
      await expect(c.page.getByText(title, { exact: true }).first()).toBeVisible();
    }
    await expect(c.configureLinks).toHaveCount(7);
  });

  test('her kanal kartının Configure bağlantısı doğru rotaya işaret ediyor @critical', async ({ app }) => {
    const c = app.channelsHub;
    await c.open();
    for (const [, href] of Object.entries(ChannelsHubPage.CONFIGURE_HREFS)) {
      await expect(c.page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });
});

// ═══════════════ STİL: VERİ SADAKATİ (@data) ═══════════════
test.describe('Kanallar hub — veri sadakati @data', () => {
  test('kanal config uçları çağrılıyor (GET /channels/<kanal>/config 2xx)', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => /\/api\/v1\/channels\/[a-z]+\/config/.test(r.url()) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.channelsHub.open();
    await resP;
  });
});

// ──────────── 3 KATMAN: KART → CONFIGURE NAVİGASYONU (@regression) ────────────
// NOT: hub açılışında 7 kanal config'i (email dahil) zaten çekildiğinden client-nav'da
// yeni config isteği garanti değil (cache). L2 backend teyidi hedef sayfanın kendi @data
// testinde yapılır; burada L1 (tıklama) + L3 (hedef gerçekten yüklendi) doğrulanır.
test.describe('Kanallar hub — Configure navigasyonu @regression', () => {
  test('L1+L3: Email kartı Configure → /channels/email gerçekten yükleniyor', async ({ app, page }) => {
    const c = app.channelsHub;
    await c.open();
    // L1: tıklama.
    await c.page.locator('a[href="/channels/email"]').click();
    // L3: hedef gerçekten yüklendi (başlık görünür + oturum korunuyor).
    await assertDestinationLoaded(page, { path: '/channels/email', heading: 'Email Channel' });
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Kanallar hub — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık çevrili`, async ({ app }) => {
      const c = app.channelsHub;
      await c.open();
      if (t.endonym) await c.switchLanguage(t.endonym);
      await expect(c.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(c.page.getByRole('heading', { name: t.heading, exact: true })).toBeVisible();
      await expect(c.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
    });
  }
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Kanallar hub — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const c = app.channelsHub;
    await c.open();
    await expectNoSevereA11y(c.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Kanallar hub — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/channels');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Kanallar hub — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    await app.channelsHub.open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Kanallar hub — hata-yolu @errorpath', () => {
  test('kanal config uçları 500 dönse de kabuk + hub başlığı sağlam', async ({ app, page }) => {
    await mockApi(page, '**/api/v1/channels/**/config', { status: 500 });
    const c = app.channelsHub;
    await page.goto('/channels', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Kanallar hub — deep-link @deeplink', () => {
  test('/channels doğrudan açılınca hub yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const c = app.channelsHub;
    await page.goto('/channels', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toBeVisible({ timeout: 30000 });
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE ═══════════════
test.describe('Kanallar hub — görsel @visual', () => {
  test('kanal kartları ızgarası görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const c = app.channelsHub;
    await c.open();
    await waitForUiToSettle(c.page);
    await expect(c.page.locator('main')).toHaveScreenshot('channels-hub.png', { maxDiffPixels: 300 });
  });
});
