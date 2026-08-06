// @ts-check
import { test, expect } from '../fixtures/test.js';
import { VoiceSubPage } from '../pages/VoiceSubPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from '../helpers.js';

/**
 * VOICE › IVR Tasarımcısı (`/voice/ivr`) — YENİ keşfedilen rota (alt-nav'da; hiç test edilmemişti).
 * Keşif + kanıt: docs/sesli-kesif/NOTLAR.md (2–3 Ağu 2026, app.vomenta.com).
 * IVR tablosu (Name/Type/Status/Last Modified/Assigned DID) + "Create IVR" (dialog).
 * `GET /api/v1/ivr` (+ ivr/templates). Konsol + a11y temiz.
 * GÜVENLİK (production salt-okunur): Create IVR ASLA gönderilmez (mutation → staging).
 */
const KEY = 'ivr';
const META = VoiceSubPage.SECTIONS[KEY];

test.describe('IVR — yapı @smoke', () => {
  test('sayfa "IVR Builder" başlığı + alt-başlık + "Create IVR" ile açılıyor', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    await expect(v.subtitle('en')).toBeVisible();
    await expect(v.page.getByRole('button', { name: 'Create IVR', exact: true })).toBeVisible();
  });
});

test.describe('IVR — veri sadakati @data', () => {
  test('GET /ivr çağrılıyor + IVR tablosu render ediliyor', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes(META.api) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.voiceSub(KEY).open();
    await resP;
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("IVR — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(META.i18n)) {
    test(`[${code}] başlık + yön + alt başlık çevrili`, async ({ app }) => {
      const v = app.voiceSub(KEY);
      await v.open();
      if (t.endonym) await v.switchLanguage(t.endonym);
      await expect(v.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(v.page.getByRole('heading', { name: t.heading, exact: true }).first()).toBeVisible();
      await expect(v.subtitle(code)).toBeVisible();
    });
  }
});

test.describe('IVR — erişilebilirlik @a11y', () => {
  test('ciddi/kritik a11y ihlali yok (bilinen borç hariç)', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    await waitForUiToSettle(v.page);
    await expectNoSevereA11y(v.page);
  });
});

test.describe('IVR — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, META.path);
  });
});

test.describe('IVR — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    await app.voiceSub(KEY).open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('IVR — "Create IVR" dialogu (salt-okunur L1 + klavye) @regression @keyboard', () => {
  test('L1: "Create IVR" tıklanınca dialog açılıyor; klavye ile kapanıyor (gönderilmez)', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    await v.page.getByRole('button', { name: 'Create IVR', exact: true }).click();
    const dialog = v.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expectDialogKeyboard(v.page, dialog);
  });
});

test.describe('IVR — hata-yolu @errorpath', () => {
  test('GET /ivr 500 dönse de kabuk + başlık sağlam', async ({ app, page }) => {
    await mockApi(page, '**/api/v1/ivr', { status: 500 });
    const v = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(v.shell.loginHeading).toBeHidden();
    await expect(v.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('IVR — deep-link @deeplink', () => {
  test('/voice/ivr doğrudan açılınca yükleniyor', async ({ app, page }) => {
    const v = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(v.shell.loginHeading).toBeHidden();
    await expect(v.heading).toBeVisible({ timeout: 30000 });
  });
});
