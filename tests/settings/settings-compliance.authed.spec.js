// @ts-check
import { test, expect } from '../fixtures/test.js';
import { CompliancePage } from '../pages/CompliancePage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  assertDestinationLoaded,
  mockApi,
  waitForUiToSettle,
} from '../helpers.js';

/**
 * AYARLAR › UYUMLULUK VE VERİ GİZLİLİĞİ (`/settings/compliance`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): Log Consent / Revoke / Create Request ASLA gönderilmez
 * (kalıcı uyumluluk/yasal kayıt; UI'da silme yok). Dialoglar yalnızca AÇILIR + boş-submit
 * disabled doğrulanır. L3 kalıcı kayıt staging: tests/settings-compliance-mutations.authed.spec.js.
 */

const I18N = CompliancePage.I18N;
const API = CompliancePage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Uyumluluk — yapı', () => {
  test('sayfa başlığı + tüm bölümler render ediliyor @smoke', async ({ app }) => {
    const c = app.compliance;
    await c.open();
    await expect(c.heading).toHaveText(I18N.en.heading);
    await expect(c.page.getByText(I18N.en.subtitle, { exact: false }).first()).toBeVisible();
    for (const section of I18N.en.sections) {
      await expect(c.page.getByText(section, { exact: false }).first()).toBeVisible();
    }
  });

  test('bölüm eylem butonları görünüyor (Log Consent / Create Request) @critical', async ({ app }) => {
    const c = app.compliance;
    await c.open();
    await expect(c.logConsentButton).toBeVisible();
    await expect(c.createRequestButton).toBeVisible();
  });
});

// ──────────── 3 KATMAN: NAVİGASYON LİNKLERİ (@regression) ────────────
test.describe('Uyumluluk — navigasyon linkleri @regression', () => {
  test('L3: "Manage Retention" → /settings/data-retention sayfasını yüklüyor', async ({ app, page }) => {
    const c = app.compliance;
    await c.open();
    await page.getByRole('link', { name: I18N.en.manageRetention, exact: true }).click();
    await page.waitForURL((u) => u.pathname.startsWith('/settings/data-retention'), { timeout: 15000 });
    await expect(c.shell.loginHeading).toBeHidden();
  });

  test('L3: "View More" → /settings/audit sayfasını yüklüyor', async ({ app, page }) => {
    const c = app.compliance;
    await c.open();
    await page.getByRole('link', { name: I18N.en.viewMore, exact: true }).click();
    await page.waitForURL((u) => u.pathname.startsWith('/settings/audit'), { timeout: 15000 });
    await expect(c.shell.loginHeading).toBeHidden();
  });
});

// ──────────── 3 KATMAN: DIALOG'LAR (L1 + boş-submit) (@regression) ────────────
test.describe('Uyumluluk — dialoglar @regression', () => {
  test('L1: Log Consent dialogu açılıyor (alanlar + Log Consent disabled)', async ({ app }) => {
    const c = app.compliance;
    await c.open();
    const dialog = await c.openDialog(c.logConsentButton);
    await expect(dialog.getByRole('heading', { name: I18N.en.logConsentDialog, exact: true })).toBeVisible();
    // Boş formda gönder butonu DISABLED (kayıt OLUŞTURULMAZ).
    await expect(dialog.getByRole('button', { name: I18N.en.logConsent, exact: true })).toBeDisabled();
    await c.page.keyboard.press('Escape');
  });

  test('L1: Create Request dialogu açılıyor (alanlar + Export Data disabled)', async ({ app }) => {
    const c = app.compliance;
    await c.open();
    const dialog = await c.openDialog(c.createRequestButton);
    await expect(dialog.getByRole('heading', { name: I18N.en.createRequestDialog, exact: true })).toBeVisible();
    // Boş formda gönder butonu DISABLED (talep OLUŞTURULMAZ).
    await expect(dialog.getByRole('button', { name: /Export Data|Submit/i })).toBeDisabled();
    await c.page.keyboard.press('Escape');
  });

  test('L3 (kalıcı kayıt) N/A: prod salt-okunur — staging lane\'ine bırakıldı', async ({ app }) => {
    // Log Consent / Create Request kalıcı uyumluluk kaydı üretir + UI'da silme yok → staging.
    const c = app.compliance;
    await c.open();
    await expect(c.logConsentButton).toBeVisible();
    await expect(c.createRequestButton).toBeVisible();
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Uyumluluk — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + eylem butonları çevrili`, async ({ app }) => {
      const c = app.compliance;
      await c.open();
      if (t.endonym) await c.switchLanguage(t.endonym);

      await expect(c.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(c.heading).toHaveText(t.heading);
      await expect(c.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      await expect(c.page.getByRole('button', { name: t.logConsent, exact: true })).toBeVisible();
      await expect(c.page.getByRole('button', { name: t.createRequest, exact: true })).toBeVisible();
    });
  }
});

// ─── BULGU: dialog "Close" (X) butonu ÇEVRİLMİYOR (Users/Roles ile aynı sistemik sızıntı) ───
test.describe('Uyumluluk — çeviri sızıntısı (bilinen hata) @i18n @known-bug', () => {
  test('Log Consent dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")', async ({ app }) => {
    test.fail(true, 'Bulgu: dialog kapat butonunun erişilebilir ismi 4 dilde de İngilizce "Close" kalıyor.');
    const c = app.compliance;
    await c.open();
    await c.switchLanguage(I18N.tr.endonym);
    const dialog = await c.openDialog(c.page.getByRole('button', { name: I18N.tr.logConsent, exact: true }));
    await expect(dialog.getByRole('button', { name: 'Kapat', exact: true })).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Uyumluluk — erişilebilirlik @a11y', () => {
  test('sayfada ve Log Consent dialogunda ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const c = app.compliance;
    await c.open();
    await expectNoSevereA11y(c.page);
    await c.openDialog(c.logConsentButton);
    await expectNoSevereA11y(c.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Uyumluluk — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/compliance');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Uyumluluk — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const c = app.compliance;
    await c.open();
    await waitForUiToSettle(c.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Uyumluluk — hata-yolu @errorpath', () => {
  test('onay listesi ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.consent}**`, { status: 500 });
    const c = app.compliance;
    await page.goto('/settings/compliance', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Uyumluluk — klavye/odak @keyboard', () => {
  test('Log Consent dialogu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const c = app.compliance;
    await c.open();
    const dialog = await c.openDialog(c.logConsentButton);
    await expectDialogKeyboard(c.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Uyumluluk — deep-link @deeplink', () => {
  test('/settings/compliance doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const c = app.compliance;
    await page.goto('/settings/compliance', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(c.shell.loginHeading).toBeHidden();
    await expect(c.heading).toHaveText(I18N.en.heading);
  });
});

// GÖRSEL REGRESYON — N/A: Sayfa 3 canlı tablo (audit/consent/GDPR — göreli zaman + tarih +
// UUID) içerir; kararlı snapshot bölgesi yok → flaky. tested-pages.js naStyles ile beyan edildi.
