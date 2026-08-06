// @ts-check
import { test, expect } from '../fixtures/test.js';
import { environment } from '../../config/environment.js';
import { DataRetentionPage } from '../pages/DataRetentionPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
} from '../helpers.js';

/**
 * AYARLAR › VERİ SAKLAMA (`/settings/data-retention`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): "Run cleanup now" (⚠️ veri siler) ve "Save changes"
 * ASLA tıklanmaz. L3 kalıcı config staging'e bırakıldı.
 */

const I18N = DataRetentionPage.I18N;
const API = DataRetentionPage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Veri Saklama — yapı', () => {
  test('sayfa başlığı + saklama süreleri + Save changes ile açılıyor @smoke', async ({ app }) => {
    const d = app.dataRetention;
    await d.open();
    await expect(d.heading).toHaveText(I18N.en.heading);
    await expect(d.page.getByText(I18N.en.section, { exact: false }).first()).toBeVisible();
    await expect(d.saveButton).toBeVisible();
  });

  test('5 saklama-süresi spinbutton\'u değerleriyle görünüyor + Run cleanup mevcut @critical', async ({ app }) => {
    const d = app.dataRetention;
    await d.open();
    await expect(d.spinButtons).toHaveCount(5);
    // Değerler render oldu (skeleton'a karşı).
    await expect(d.spinButtons.first()).toHaveValue(/\d+/);
    await expect(d.runCleanupButton).toBeVisible();
  });
});

// ──────────── 3 KATMAN: KONTROL VARLIĞI (L1) + L3 N/A (@regression) ────────────
test.describe('Veri Saklama — kontroller @regression', () => {
  test('L1: Save changes + Run cleanup now + Automatic Cleanup switch mevcut (tıklanmıyor)', async ({ app }) => {
    const d = app.dataRetention;
    await d.open();
    await expect(d.saveButton).toBeVisible();
    await expect(d.runCleanupButton).toBeVisible(); // ⚠️ veri siler → TIKLANMAZ
    await expect(d.page.getByRole('switch').first()).toBeVisible();
    // L3 (kalıcı kayıt / cleanup) yalnız staging: settings-data-retention-mutations.authed.spec.js
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Veri Saklama — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + Save changes çevrili`, async ({ app }) => {
      const d = app.dataRetention;
      await d.open();
      if (t.endonym) await d.switchLanguage(t.endonym);

      await expect(d.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(d.heading).toHaveText(t.heading);
      await expect(d.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      await expect(d.page.getByRole('button', { name: t.save, exact: true })).toBeVisible();
      if (t.runCleanup) await expect(d.page.getByRole('button', { name: t.runCleanup, exact: true })).toBeVisible();
    });
  }
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
// Not: Security'nin aksine buradaki saklama-süresi spinbutton'ları erişilebilir etiket TAŞIYOR
// (ciddi ihlal yok — gözlemlendi).
test.describe('Veri Saklama — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const d = app.dataRetention;
    await d.open();
    await expectNoSevereA11y(d.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Veri Saklama — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/data-retention');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Veri Saklama — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const d = app.dataRetention;
    await d.open();
    await waitForUiToSettle(d.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Veri Saklama — hata-yolu @errorpath', () => {
  test('retention ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.retention}**`, { status: 500 });
    const d = app.dataRetention;
    await page.goto('/settings/data-retention', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(d.shell.loginHeading).toBeHidden();
    await expect(d.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Veri Saklama — deep-link @deeplink', () => {
  test('/settings/data-retention doğrudan açılınca form yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const d = app.dataRetention;
    await page.goto('/settings/data-retention', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(d.shell.loginHeading).toBeHidden();
    await expect(d.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
// Saklama-süresi formu kararlı (sabit gün değerleri; canlı veri yok).
test.describe('Veri Saklama — görsel @visual', () => {
  test('saklama-süresi formu görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const d = app.dataRetention;
    await d.open();
    await waitForUiToSettle(d.page);
    await expect(d.page.locator('main').first()).toHaveScreenshot('data-retention.png', { maxDiffPixels: 300 });
  });
});
