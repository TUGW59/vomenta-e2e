// @ts-check
import { test, expect } from './fixtures/test.js';
import { SettingsPage } from './pages/SettingsPage.js';
import {
  assertDestinationLoaded,
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * AYARLAR HUB (`/settings`) — girişli, salt-okunur.
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/). Canlı gözlem 30 Tem 2026.
 * Radix sekmeli hub; her sekme paneli ilgili özet + "dedicated page" bağlantısı içerir.
 *
 * Ayar DEĞİŞTİREN işlem YOK (hub yalnız özet + gezinme). Sekme = istemci-tarafı (L2 yok).
 *
 * BİLİNEN HATA (bu suite'te ASSERT EDİLMEZ — known-bugs paketinde guard'lı):
 *   - Billing & Usage → "Change plan"/"Billing history" → /settings/billing → "/" (kök).
 *     (SETTINGS-BILLING-CHANGEPLAN, SETTINGS-BILLING-HISTORY)
 *   - Modules → "Manage Modules" → /settings/billing/marketplace → "/" (kök). (B4)
 *   Neden: hesap billing/modül iznine sahip değil → korunan uçlar 403 → fallback.
 */

const I18N = SettingsPage.I18N;

/**
 * Her sekmenin panel içerik imzası (canlı gözlem 30 Tem 2026). Sekme "seçili" görünürken
 * panelinin gerçekten o sekmenin içeriğini render ettiğini doğrular — AGENTS.md
 * "İçerik ve değer derinliği standardı".
 */
const TAB_SIGNATURES = {
  Organization: 'Go to Organization Settings',
  Users: 'Team Members',
  'Billing & Usage': 'Current Plan',
  Security: 'Security Settings',
  'API Keys': 'Create key',
  Modules: 'Manage add-on modules',
};

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Ayarlar hub — yapı', () => {
  test('sayfa "Settings" başlığıyla açılıyor @smoke', async ({ app }) => {
    const { settings } = app;
    await settings.open();
    await expect(settings.heading).toBeVisible();
  });

  test('tüm sekmeler görünüyor @critical', async ({ app }) => {
    const { settings } = app;
    await settings.open();
    for (const name of SettingsPage.TABS) {
      await expect(settings.tab(name)).toBeVisible();
    }
  });
});

// ──────────── 3 KATMAN: SEKMELER (L1 + L3; L2 N/A) (@regression) ────────────
// L1 = tıklama seçili yapar; L3 = panel o sekmenin içeriğini render eder.
// L2 (arka plan) N/A: sekme değişimi saf istemci-tarafı (backend çağrısı yok).
test.describe('Ayarlar hub — sekme 3-katman @regression', () => {
  test('L1+L3: her sekme tıklanınca seçili oluyor VE paneli o içeriği gösteriyor', async ({ app, page }) => {
    const { settings } = app;
    await settings.open();
    for (const name of SettingsPage.TABS) {
      await expect(settings.tab(name)).toBeVisible();
      await settings.selectTab(name); // L1: aria-selected='true'
      // L3: panel gerçekten o sekmenin içeriğini render etti mi?
      await expect(page.getByText(TAB_SIGNATURES[name], { exact: false }).first()).toBeVisible({ timeout: 10000 });
    }
  });
});

// ──────── 3 KATMAN: PANEL GEZİNME BAĞLANTILARI — L3 hedef yüklendi (@regression) ────────
// Navigasyon L3 (AGENTS.md): salt URL değil, hedef sayfanın başlığı görünmeli.
// Yalnız ÇALIŞAN hedefler burada; Billing/Modules bağlantıları known-bugs'ta guard'lı.
test.describe('Ayarlar hub — panel gezinme L3 @regression', () => {
  for (const tabName of ['Organization', 'Security', 'API Keys']) {
    const { link, path, heading } = SettingsPage.PANEL_LINKS[tabName];
    test(`L3 görev OK: "${tabName}" paneli → ${path} (başlık "${heading}")`, async ({ app, page }) => {
      const { settings } = app;
      await settings.open();
      await settings.selectTab(tabName);
      const navLink = page.getByRole('link', { name: link, exact: true });
      await expect(navLink).toBeVisible();
      await navLink.click();
      await assertDestinationLoaded(page, { path, heading });
    });
  }
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Ayarlar hub — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + 6 sekme etiketi çevrili`, async ({ app }) => {
      const { settings } = app;
      await settings.open();
      if (t.endonym) await settings.switchLanguage(t.endonym);

      await expect(settings.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(settings.heading).toHaveText(t.heading);
      for (const label of t.tabs) {
        await expect(settings.page.getByRole('tab', { name: label, exact: true })).toBeVisible();
      }
    });
  }
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Ayarlar hub — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const { settings } = app;
    await settings.open();
    await expectNoSevereA11y(settings.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Ayarlar hub — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Ayarlar hub — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const { settings } = app;
    await settings.open();
    await waitForUiToSettle(settings.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Ayarlar hub — hata-yolu @errorpath', () => {
  test('billing/subscription 500 dönse de hub sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, '**/api/v1/billing/subscription**', { status: 500 });
    const { settings } = app;
    await page.goto('/settings', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(settings.shell.loginHeading).toBeHidden();
    await expect(settings.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Ayarlar hub — klavye/odak @keyboard', () => {
  test('sekmelerde ok tuşu odağı taşıyor ve seçimi değiştiriyor (aria-selected)', async ({ app, page }) => {
    const { settings } = app;
    await settings.open();
    await waitForUiToSettle(settings.page);
    const org = settings.tab('Organization');
    const users = settings.tab('Users');
    await org.click();
    await expect(org).toHaveAttribute('aria-selected', 'true');
    // Radix ok-tuşu ilk basışta yutulabilir (hidrasyon/re-render); seçim taşınana kadar
    // tekrar dene — Radix sekme TIKLAMASI için selectTab'de kullanılan aynı dayanıklılık.
    // locator.press önce öğeye odaklanır → odak yarışı da olmaz.
    await expect(async () => {
      await org.press('ArrowRight');
      await expect(users).toHaveAttribute('aria-selected', 'true', { timeout: 1500 });
    }).toPass({ timeout: 15000 });
    await expect(org).toHaveAttribute('aria-selected', 'false');
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Ayarlar hub — deep-link @deeplink', () => {
  test('/settings doğrudan açılınca hub yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const { settings } = app;
    await page.goto('/settings', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(settings.shell.loginHeading).toBeHidden();
    await expect(settings.heading).toHaveText(I18N.en.heading);
  });
});
