// @ts-check
import { test, expect } from './fixtures/test.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * AYARLAR › BİLDİRİMLER (`/settings/notifications`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): Save preferences / switch / Enable push ASLA tıklanmaz.
 */

const I18N = NotificationsPage.I18N;
const API = NotificationsPage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Bildirimler — yapı', () => {
  test('sayfa başlığı + Email Category Preferences + Save ile açılıyor @smoke', async ({ app }) => {
    const n = app.notifications;
    await n.open();
    await expect(n.heading).toHaveText(I18N.en.heading);
    await expect(n.page.getByText(I18N.en.emailSection, { exact: false }).first()).toBeVisible();
    await expect(n.saveButton).toBeVisible();
  });

  test('kategori switch\'leri + Delivery Channels bölümü görünüyor @critical', async ({ app }) => {
    const n = app.notifications;
    await n.open();
    await expect(n.page.getByText('Account & Activity', { exact: false }).first()).toBeVisible();
    await expect(n.page.getByText(I18N.en.deliverySection, { exact: false }).first()).toBeVisible();
    await expect(n.page.getByRole('switch').first()).toBeVisible();
  });
});

// ──────────── 3 KATMAN: KONTROL VARLIĞI (L1) + L3 N/A (@regression) ────────────
test.describe('Bildirimler — kontroller @regression', () => {
  test('L1: Save preferences + Enable push + kategori switch\'leri mevcut (tıklanmıyor)', async ({ app }) => {
    const n = app.notifications;
    await n.open();
    await expect(n.saveButton).toBeVisible();
    await expect(n.page.getByRole('button', { name: I18N.en.enablePush, exact: true })).toBeVisible();
    await expect(n.page.getByRole('switch').first()).toBeChecked();
    // L3 (kalıcı tercih) yalnız staging: settings-notifications-mutations.authed.spec.js
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Bildirimler — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + Save + Enable push çevrili`, async ({ app }) => {
      const n = app.notifications;
      await n.open();
      if (t.endonym) await n.switchLanguage(t.endonym);

      await expect(n.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(n.heading).toHaveText(t.heading);
      await expect(n.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      await expect(n.page.getByRole('button', { name: t.save, exact: true }).first()).toBeVisible();
      await expect(n.page.getByRole('button', { name: t.enablePush, exact: true })).toBeVisible();
    });
  }
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Bildirimler — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const n = app.notifications;
    await n.open();
    await expectNoSevereA11y(n.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Bildirimler — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/notifications');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Bildirimler — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const n = app.notifications;
    await n.open();
    await waitForUiToSettle(n.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Bildirimler — hata-yolu @errorpath', () => {
  test('tercihler ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.prefs}**`, { status: 500 });
    await mockApi(page, `**${API.emailPrefs}**`, { status: 500 });
    const n = app.notifications;
    await page.goto('/settings/notifications', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(n.shell.loginHeading).toBeHidden();
    await expect(n.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Bildirimler — deep-link @deeplink', () => {
  test('/settings/notifications doğrudan açılınca form yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const n = app.notifications;
    await page.goto('/settings/notifications', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(n.shell.loginHeading).toBeHidden();
    await expect(n.heading).toHaveText(I18N.en.heading);
  });
});

// GÖRSEL REGRESYON — N/A (tested-pages naStyles): sayfa çok uzun bir tercih formu (onlarca
// switch, kategoriler); tek kararlı snapshot bölgesi pratik değil. Klavye/odak — N/A: diyalog/
// menü/sekme yok.
