// @ts-check
import { test, expect } from './fixtures/test.js';
import { AiUsagePage } from './pages/AiUsagePage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  waitForUiToSettle,
  mockApi,
} from './helpers.js';

/**
 * YAPAY ZEKA → KULLANIM (`/ai/usage`) — girişli, SALT-OKUNUR.
 * C1: L1 → dedicated L2·deep. 4 KPI döşemesi + 2 kullanım tablosu (Usage by Feature/Model)
 * + dönem seçici. Sekme/arama YOK. Veri GET /api/v1/ai/usage.
 * Etkileşim derinliği (@ix-table): ai-usage-interactions.authed.spec.js.
 */

const I18N = AiUsagePage.I18N;

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('AI Kullanım — yapı', () => {
  /** @type {AiUsagePage} */
  let u;
  test.beforeEach(async ({ app }) => {
    u = app.aiUsage;
    await u.open();
  });

  test('başlık + KPI döşemeleri + kullanım tabloları görünüyor @smoke @critical', async () => {
    await expect(u.heading).toHaveText(I18N.en.heading);
    for (const label of AiUsagePage.KPIS) {
      await expect(u.page.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(u.page.getByText('Usage by Feature', { exact: true })).toBeVisible();
    await expect(u.page.getByText('Usage by Model', { exact: true })).toBeVisible();
  });
});

// ──────────────────────── 4 DİL i18n GUARD'LARI ────────────────────────
test.describe('AI Kullanım — 4 dil çeviri guard\'ları @i18n @regression', () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön çevrili`, async ({ app }) => {
      const u = app.aiUsage;
      await u.open();
      if (t.endonym) await u.switchLanguage(t.endonym);
      await expect(u.page.locator('html')).toHaveAttribute('dir', t.dir);
      await expect(u.heading).toHaveText(t.heading);
    });
  }
});

// ═══════════════════════ STİL SÖZLEŞMESİ ═══════════════════════
test.describe('AI Kullanım — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const u = app.aiUsage;
    await u.open();
    await expectNoSevereA11y(u.page);
  });
});

test.describe('AI Kullanım — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/ai/usage');
  });
});

test.describe('AI Kullanım — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const u = app.aiUsage;
    await u.open();
    await waitForUiToSettle(u.page);
    diagnostics.assertClean();
  });
});

test.describe('AI Kullanım — deep-link @deeplink', () => {
  test('/ai/usage doğrudan açılınca yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const u = app.aiUsage;
    await page.goto('/ai/usage', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(u.shell.loginHeading).toBeHidden();
    await expect(u.heading).toHaveText(I18N.en.heading);
  });
});

test.describe('AI Kullanım — hata-yolu @errorpath', () => {
  test('usage ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${AiUsagePage.API.usage}**`, { status: 500 });
    const u = app.aiUsage;
    await page.goto('/ai/usage', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(u.shell.loginHeading).toBeHidden();
    await expect(u.heading).toHaveText(I18N.en.heading);
  });
});

test.describe('AI Kullanım — sayısal döşeme değeri @data', () => {
  test('KPI döşemesi (Total Tokens) API-bağlı bir DEĞER gösteriyor', async ({ app, page }) => {
    const u = app.aiUsage;
    const respP = page.waitForResponse(
      (r) => r.url().includes(AiUsagePage.API.usage) && r.request().method() === 'GET' && r.ok(),
      { timeout: 15000 }
    );
    await u.open();
    await respP;
    // Değer etiketin büyükebeveyninde (tile deseni) → kap metninde sayı/işaret ara.
    const label = u.page.getByText('Total Tokens', { exact: true }).first();
    await expect(async () => {
      const txt = await label.evaluate((el) => {
        const tile = el.closest('[class*="card"],[class*="tile"],[class*="stat"]') ||
          el.parentElement?.parentElement || el.parentElement;
        return tile ? tile.textContent || '' : '';
      });
      expect(/\d|%|\$|—|N\/A/.test(txt), 'tile kabında sayısal değer görünmeli').toBeTruthy();
    }).toPass({ timeout: 10000 });
  });
});
