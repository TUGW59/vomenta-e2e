// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { TeamsPage } from './pages/TeamsPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * AYARLAR › EKİPLER (`/settings/teams`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): Create Team / Edit ASLA gönderilmez. Create dialogu
 * yalnızca AÇILIR + boş-submit disabled. L3 kalıcı kayıt staging:
 * tests/settings-teams-mutations.authed.spec.js.
 */

const I18N = TeamsPage.I18N;
const API = TeamsPage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Ekipler — yapı', () => {
  test('sayfa "Teams" başlığı + Create Team + ekip kartı ile açılıyor @smoke', async ({ app }) => {
    const t = app.teams;
    await t.open();
    await expect(t.heading).toHaveText(I18N.en.heading);
    await expect(t.page.getByText(I18N.en.subtitle, { exact: false }).first()).toBeVisible();
    await expect(t.createButton).toBeVisible();
  });

  test('en az bir ekip kartı üye sayısıyla görünüyor @critical', async ({ app }) => {
    const t = app.teams;
    await t.open();
    // Ekip kartı: ad + "N members" (skeleton'a karşı gerçek içerik).
    await expect(t.page.getByText(/\d+\s+members?/i).first()).toBeVisible({ timeout: 10000 });
  });
});

// ──────────── 3 KATMAN: CREATE TEAM DIALOG (L1 + boş-submit) (@regression) ────────────
test.describe('Ekipler — Create Team dialogu @regression', () => {
  test('L1 tıklama OK: dialog açılıyor (Ad/Açıklama + Create disabled)', async ({ app }) => {
    const t = app.teams;
    await t.open();
    const dialog = await t.openCreateDialog();
    await expect(dialog.getByRole('heading', { name: I18N.en.createDialog, exact: true })).toBeVisible();
    await expect(dialog.getByRole('textbox').first()).toBeVisible();
    // Boş formda Create DISABLED (ekip OLUŞTURULMAZ).
    await expect(dialog.getByRole('button', { name: 'Create', exact: true })).toBeDisabled();
    await t.page.keyboard.press('Escape');
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Ekipler — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, tt] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + Create butonu çevrili`, async ({ app }) => {
      const t = app.teams;
      await t.open();
      if (tt.endonym) await t.switchLanguage(tt.endonym);

      await expect(t.page.locator('body')).toHaveCSS('direction', tt.dir);
      await expect(t.heading).toHaveText(tt.heading);
      await expect(t.page.getByText(tt.subtitle, { exact: false }).first()).toBeVisible();
      await expect(t.page.getByRole('button', { name: tt.create, exact: true })).toBeVisible();
    });
  }
});

// ─── BULGU: Create Team dialogu "Close" (X) butonu ÇEVRİLMİYOR (sistemik sızıntı) ───
test.describe('Ekipler — çeviri sızıntısı (bilinen hata) @i18n @known-bug', () => {
  test('Create Team dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")', async ({ app }) => {
    test.fail(true, 'Bulgu: dialog kapat butonunun erişilebilir ismi 4 dilde de İngilizce "Close" kalıyor.');
    const t = app.teams;
    await t.open();
    await t.switchLanguage(I18N.tr.endonym);
    // tr'de Create butonu "Ekip Oluştur"
    await expect(async () => {
      await t.page.getByRole('button', { name: I18N.tr.create, exact: true }).click();
      await expect(t.page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(t.page.getByRole('dialog').getByRole('button', { name: 'Kapat', exact: true })).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Ekipler — erişilebilirlik @a11y', () => {
  test('sayfada ve Create Team dialogunda ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const t = app.teams;
    await t.open();
    await expectNoSevereA11y(t.page);
    await t.openCreateDialog();
    await expectNoSevereA11y(t.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Ekipler — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/teams');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Ekipler — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const t = app.teams;
    await t.open();
    await waitForUiToSettle(t.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Ekipler — hata-yolu @errorpath', () => {
  test('ekip listesi 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.teams}`, { status: 500 });
    const t = app.teams;
    await page.goto('/settings/teams', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(t.shell.loginHeading).toBeHidden();
    await expect(t.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Ekipler — klavye/odak @keyboard', () => {
  test('Create Team dialogu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const t = app.teams;
    await t.open();
    const dialog = await t.openCreateDialog();
    await expectDialogKeyboard(t.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Ekipler — deep-link @deeplink', () => {
  test('/settings/teams doğrudan açılınca liste yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const t = app.teams;
    await page.goto('/settings/teams', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(t.shell.loginHeading).toBeHidden();
    await expect(t.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
test.describe('Ekipler — görsel @visual', () => {
  test('Create Team dialogu görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const t = app.teams;
    await t.open();
    const dialog = await t.openCreateDialog();
    await waitForUiToSettle(t.page);
    await expect(dialog).toHaveScreenshot('teams-create-dialog.png', { maxDiffPixels: 200 });
  });
});
