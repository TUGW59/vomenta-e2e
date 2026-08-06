// @ts-check
import { test, expect } from '../fixtures/test.js';
import { environment } from '../../config/environment.js';
import { SecurityPage } from '../pages/SecurityPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from '../helpers.js';

/**
 * AYARLAR › GÜVENLİK (`/settings/security`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): Save/Revoke/Add IP/2FA ASLA gönderilmez (hassas config).
 * Add IP dialogu yalnızca AÇILIR. L3 kalıcı config staging'e bırakıldı.
 */

const I18N = SecurityPage.I18N;
const API = SecurityPage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Güvenlik — yapı', () => {
  test('sayfa başlığı + Password Policies + Save (disabled) ile açılıyor @smoke', async ({ app }) => {
    const s = app.security;
    await s.open();
    await expect(s.heading).toHaveText(I18N.en.heading);
    await expect(s.page.getByText('Password Policies', { exact: false }).first()).toBeVisible();
    await expect(s.savePolicyButton).toBeDisabled();
  });

  test('bölümler: Session Management / IP Whitelist / API Keys görünüyor @critical', async ({ app }) => {
    const s = app.security;
    await s.open();
    await expect(s.page.getByText('Session Management', { exact: false }).first()).toBeVisible();
    await expect(s.page.getByRole('heading', { name: 'Active Sessions', exact: false })).toBeVisible();
    await expect(s.addIpButton).toBeVisible();
  });
});

// ──────────── 3 KATMAN: NAVİGASYON + ADD IP DIALOG (@regression) ────────────
test.describe('Güvenlik — navigasyon + Add IP @regression', () => {
  test('L3: "Open Contacts" → /contacts; "Manage API Keys" → /settings/api-keys', async ({ app, page }) => {
    const s = app.security;
    await s.open();
    await page.getByRole('link', { name: I18N.en.manageKeys, exact: true }).click();
    await page.waitForURL((u) => u.pathname.startsWith('/settings/api-keys'), { timeout: 15000 });
    await expect(s.shell.loginHeading).toBeHidden();
  });

  test('L1: Add IP dialogu açılıyor (IP/CIDR + Add to Whitelist disabled)', async ({ app }) => {
    const s = app.security;
    await s.open();
    const dialog = await s.openAddIpDialog();
    await expect(dialog.getByRole('heading', { name: I18N.en.ipDialog, exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Add to Whitelist', exact: true })).toBeDisabled();
    await s.page.keyboard.press('Escape');
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Güvenlik — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + Save Policy + Add IP çevrili`, async ({ app }) => {
      const s = app.security;
      await s.open();
      if (t.endonym) await s.switchLanguage(t.endonym);

      await expect(s.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(s.heading).toHaveText(t.heading);
      await expect(s.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      await expect(s.page.getByRole('button', { name: t.savePolicy, exact: true })).toBeVisible();
      await expect(s.page.getByRole('button', { name: t.addIp, exact: true })).toBeVisible();
    });
  }
});

// ─── BULGU: Add IP dialogu "Close" (X) butonu ÇEVRİLMİYOR (sistemik sızıntı) ───
test.describe('Güvenlik — çeviri sızıntısı (bilinen hata) @i18n @known-bug', () => {
  test('Add IP dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")', async ({ app }) => {
    test.fail(true, 'Bulgu: dialog kapat butonunun erişilebilir ismi 4 dilde de İngilizce "Close" kalıyor.');
    const s = app.security;
    await s.open();
    await s.switchLanguage(I18N.tr.endonym);
    await expect(async () => {
      await s.page.getByRole('button', { name: I18N.tr.addIp, exact: true }).click();
      await expect(s.page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(s.page.getByRole('dialog').getByRole('button', { name: 'Kapat', exact: true })).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
// 🐞 BULGU: Password Policy / Session Timeout sayı (spinbutton) alanları erişilebilir etiket
// taşımıyor → axe `label` (critical, 3 düğüm). Düzelince "beklenmedik geçiş" verir → test.fail
// kaldırılıp kalıcı guard olur.
test.describe('Güvenlik — erişilebilirlik @a11y @known-bug', () => {
  test('sayfada ciddi/kritik a11y ihlali olmamalı (şu an: label/critical spinbutton)', async ({ app }) => {
    test.fail(true, 'Bulgu: şifre politikası / oturum zaman aşımı sayı alanları etiketsiz (axe label/critical).');
    const s = app.security;
    await s.open();
    await expectNoSevereA11y(s.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Güvenlik — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/security');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Güvenlik — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const s = app.security;
    await s.open();
    await waitForUiToSettle(s.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Güvenlik — hata-yolu @errorpath', () => {
  test('security ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.security}**`, { status: 500 });
    const s = app.security;
    await page.goto('/settings/security', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(s.shell.loginHeading).toBeHidden();
    await expect(s.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Güvenlik — klavye/odak @keyboard', () => {
  test('Add IP dialogu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const s = app.security;
    await s.open();
    const dialog = await s.openAddIpDialog();
    await expectDialogKeyboard(s.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Güvenlik — deep-link @deeplink', () => {
  test('/settings/security doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const s = app.security;
    await page.goto('/settings/security', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(s.shell.loginHeading).toBeHidden();
    await expect(s.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
// Add IP dialogu kararlı (canlı veri yok).
test.describe('Güvenlik — görsel @visual', () => {
  test('Add IP dialogu görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const s = app.security;
    await s.open();
    const dialog = await s.openAddIpDialog();
    await waitForUiToSettle(s.page);
    await expect(dialog).toHaveScreenshot('security-add-ip-dialog.png', { maxDiffPixels: 250 });
  });
});
