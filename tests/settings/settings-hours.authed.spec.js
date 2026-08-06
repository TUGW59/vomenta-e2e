// @ts-check
import { test, expect } from '../fixtures/test.js';
import { environment } from '../../config/environment.js';
import { BusinessHoursPage } from '../pages/BusinessHoursPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
} from '../helpers.js';

/**
 * AYARLAR › ÇALIŞMA SAATLERİ (`/settings/hours`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): Save changes / gün switch / Add ASLA tıklanmaz. Geri-
 * döndürülebilir gün-switch düzenlemesi yalnız staging: tests/settings-hours-mutations.authed.spec.js.
 */

const I18N = BusinessHoursPage.I18N;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Çalışma Saatleri — yapı', () => {
  test('sayfa başlığı + haftalık program + Save changes ile açılıyor @smoke', async ({ app }) => {
    const h = app.businessHours;
    await h.open();
    await expect(h.heading).toHaveText(I18N.en.heading);
    await expect(h.page.getByText(I18N.en.weekly, { exact: false }).first()).toBeVisible();
    await expect(h.saveButton).toBeVisible();
  });

  test('7 günlük Open switch\'i var; Pzt-Cum açık, Cmt/Paz kapalı @critical', async ({ app }) => {
    const h = app.businessHours;
    await h.open();
    // 7 gün + After Hours = en az 8 switch; ilk 5 (Pzt-Cum) checked.
    await expect(h.daySwitches).toHaveCount(8);
    for (let i = 0; i < 5; i++) {
      await expect(h.daySwitches.nth(i)).toBeChecked();
    }
    // Cmt/Paz kapalı.
    await expect(h.daySwitches.nth(5)).not.toBeChecked();
    await expect(h.daySwitches.nth(6)).not.toBeChecked();
  });

  test('Holiday Calendar bölümü + Add (boşken disabled) @regression', async ({ app }) => {
    const h = app.businessHours;
    await h.open();
    await expect(h.page.getByText(I18N.en.holidays, { exact: false }).first()).toBeVisible();
    await expect(h.addHolidayButton).toBeDisabled(); // Date/ad boşken
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Çalışma Saatleri — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + Save/Add çevrili`, async ({ app }) => {
      const h = app.businessHours;
      await h.open();
      if (t.endonym) await h.switchLanguage(t.endonym);

      await expect(h.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(h.heading).toHaveText(t.heading);
      await expect(h.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      await expect(h.page.getByRole('button', { name: t.save, exact: true })).toBeVisible();
      await expect(h.page.getByRole('button', { name: t.add, exact: true })).toBeVisible();
    });
  }
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Çalışma Saatleri — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const h = app.businessHours;
    await h.open();
    await expectNoSevereA11y(h.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Çalışma Saatleri — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/hours');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Çalışma Saatleri — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const h = app.businessHours;
    await h.open();
    await waitForUiToSettle(h.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Çalışma Saatleri — hata-yolu @errorpath', () => {
  test('business-hours ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, '**/api/v1/**business-hours**', { status: 500 });
    await mockApi(page, '**/api/v1/settings/hours**', { status: 500 });
    const h = app.businessHours;
    await page.goto('/settings/hours', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(h.shell.loginHeading).toBeHidden();
    await expect(h.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Çalışma Saatleri — klavye/odak @keyboard', () => {
  test('Timezone combobox açılıp Escape ile kapanıyor', async ({ app }) => {
    const h = app.businessHours;
    await h.open();
    const combo = h.page.getByRole('combobox').first();
    await combo.click();
    const firstOpt = h.page.getByRole('option').first();
    await expect(firstOpt).toBeVisible();
    await h.page.keyboard.press('Escape');
    await expect(firstOpt).toBeHidden();
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Çalışma Saatleri — deep-link @deeplink', () => {
  test('/settings/hours doğrudan açılınca form yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const h = app.businessHours;
    await page.goto('/settings/hours', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(h.shell.loginHeading).toBeHidden();
    await expect(h.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
// Haftalık program tablosu kararlı (sabit 09:00-17:00, canlı veri yok).
test.describe('Çalışma Saatleri — görsel @visual', () => {
  test('haftalık program görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const h = app.businessHours;
    await h.open();
    await waitForUiToSettle(h.page);
    await expect(h.page.locator('main').first()).toHaveScreenshot('business-hours.png', { maxDiffPixels: 300 });
  });
});
