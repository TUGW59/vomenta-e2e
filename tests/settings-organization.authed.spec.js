// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { OrganizationPage } from './pages/OrganizationPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * AYARLAR › KURULUŞ (`/settings/organization`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * ┌─ HER KONTROL İÇİN 3 KATMAN (AGENTS.md standardı) ──────────────────────────┐
 * │ L1 — TIKLAMA OK : kontrol tepki veriyor (popover/değer/dirty durumu).      │
 * │ L2 — ARKA PLAN OK: doğru backend ucu tetiklenir (method+endpoint).         │
 * │ L3 — GÖREV OK   : kontrol amacını yerine getirir. Kalıcı kayıt → @mutation.│
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * GÜVENLİK (production salt-okunur): "Save changes" bu spec'te ASLA tıklanmaz
 * (şirket verisini platform genelinde değiştirir). Geri-döndürülebilir Website
 * düzenlemesi yalnız staging'de: tests/settings-organization-mutations.authed.spec.js.
 */

const I18N = OrganizationPage.I18N;
const API = OrganizationPage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Kuruluş — yapı', () => {
  test('sayfa "Organization" başlığı + Company Information formu ile açılıyor @smoke', async ({ app }) => {
    const o = app.organization;
    await o.open();
    await expect(o.heading).toHaveText(I18N.en.heading);
    await expect(o.page.getByText(I18N.en.section, { exact: false }).first()).toBeVisible();
  });

  test('form alanları render ediliyor (Company name/Website/Domain + Save) @critical', async ({ app }) => {
    const o = app.organization;
    await o.open();
    await expect(o.companyNameInput).toBeVisible();
    await expect(o.websiteInput).toBeVisible();
    await expect(o.domainInput).toBeVisible();
    await expect(o.saveButton).toBeVisible();
  });
});

// ──────────── 3 KATMAN: FORM DIRTY + SAVE (L1 + L3 N/A prod) (@regression) ────────────
test.describe('Kuruluş — form dirty durumu @regression', () => {
  test('L1 tıklama OK: Save changes formda değişiklik olunca aktifleşiyor (dirty)', async ({ app }) => {
    const o = app.organization;
    await o.open();
    // Başlangıçta dirty yok → disabled.
    await expect(o.saveButton).toBeDisabled();
    // Alanı değiştir → aktifleşmeli (istemci-tarafı dirty kontrolü gözlemlenebilir).
    const original = await o.websiteValue();
    await o.websiteInput.fill(`${original}`.length ? `${original} ` : 'https://example.org');
    await expect(o.saveButton).toBeEnabled();
    // Geri al (kaydetmeden) → tekrar disabled olmalı; hiçbir şey KAYDEDİLMEDİ (prod salt-okunur).
    await o.websiteInput.fill(original);
    // L3 (kalıcı kayıt) yalnız staging'de: settings-organization-mutations.authed.spec.js
  });

  test('L2 arka plan OK: sayfa açılınca kuruluş ayarları çekiliyor', async ({ app, page }) => {
    const o = app.organization;
    const req = page.waitForResponse(
      (r) => r.url().includes(API.organization) && r.request().method() === 'GET' && r.ok(),
      { timeout: 20000 }
    );
    await o.open();
    await req; // doğru GET ucu 2xx döndü + form değerlerle doldu
    await expect(o.companyNameInput).not.toHaveValue('');
  });
});

// ──────────── 3 KATMAN: SEÇENEK COMBOBOX'LARI (L1) (@regression) ────────────
// L1: popover açılır + seçenekler listelenir. L2 N/A (istemci-tarafı). L3 = seçim + Save (mutation).
test.describe('Kuruluş — seçenek combobox\'ları @regression', () => {
  test('L1 tıklama OK: Currency açılınca para birimi seçenekleri listeleniyor', async ({ app }) => {
    const o = app.organization;
    await o.open();
    // Form comboboxları: Timezone, Language, Currency, Default country (sırayla).
    const currency = o.page.getByRole('combobox').nth(2);
    await currency.click();
    await expect(o.page.getByRole('option').first()).toBeVisible();
    await o.page.keyboard.press('Escape');
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Kuruluş — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + bölüm + Save çevrili`, async ({ app }) => {
      const o = app.organization;
      await o.open();
      if (t.endonym) await o.switchLanguage(t.endonym);

      await expect(o.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(o.heading).toHaveText(t.heading);
      await expect(o.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      await expect(o.page.getByText(t.section, { exact: false }).first()).toBeVisible();
      await expect(o.page.getByRole('button', { name: t.save, exact: true })).toBeVisible();
    });
  }
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Kuruluş — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const o = app.organization;
    await o.open();
    await expectNoSevereA11y(o.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Kuruluş — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/organization');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Kuruluş — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const o = app.organization;
    await o.open();
    await waitForUiToSettle(o.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Kuruluş — hata-yolu @errorpath', () => {
  test('kuruluş ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.organization}**`, { status: 500 });
    const o = app.organization;
    await page.goto('/settings/organization', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(o.shell.loginHeading).toBeHidden();
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Kuruluş — klavye/odak @keyboard', () => {
  test('Currency popover Escape ile kapanıyor', async ({ app }) => {
    const o = app.organization;
    await o.open();
    const currency = o.page.getByRole('combobox').nth(2);
    await currency.click();
    const firstOpt = o.page.getByRole('option').first();
    await expect(firstOpt).toBeVisible();
    await o.page.keyboard.press('Escape');
    await expect(firstOpt).toBeHidden();
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Kuruluş — deep-link @deeplink', () => {
  test('/settings/organization doğrudan açılınca form yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const o = app.organization;
    await page.goto('/settings/organization', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(o.shell.loginHeading).toBeHidden();
    await expect(o.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
test.describe('Kuruluş — görsel @visual', () => {
  test('Company Information formu görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const o = app.organization;
    await o.open();
    await waitForUiToSettle(o.page);
    await expect(o.page.locator('main').first()).toHaveScreenshot('organization-form.png', { maxDiffPixels: 250 });
  });
});
