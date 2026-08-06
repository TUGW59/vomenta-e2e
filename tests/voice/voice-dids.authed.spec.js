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
 * VOICE › Telefon Numaraları / DID (`/voice/dids`) — "Phone Numbers" + "Pending Requests".
 * Keşif + kanıt: docs/sesli-kesif/NOTLAR.md (2 Ağu 2026, app.vomenta.com).
 * Register BYOC Number / Request Number (dialog "Request Phone Number") + tablo + satır
 * Assign/Unassign/Release + filtreler. `GET /api/v1/dids` (+ dids/requests). Konsol temiz.
 * Deep-link'te RSC yarışı → başlık beklenir. Bilinen hata B14 (red nedeni tooltip, veri-bağlı;
 * ayrı known-bugs.authed.spec.js testinde). GÜVENLİK: Register/Request/Assign/Release prod'da
 * TETİKLENMEZ (mutation → staging).
 */
const KEY = 'dids';
const META = VoiceSubPage.SECTIONS[KEY];

test.describe('Telefon Numaraları — yapı @smoke', () => {
  test('sayfa "Phone Numbers" + "Pending Requests" ile açılıyor', async ({ app }) => {
    const d = app.voiceSub(KEY);
    await d.open();
    await expect(d.subtitle('en')).toBeVisible();
    await expect(d.page.getByRole('heading', { name: 'Pending Requests', exact: true }).first()).toBeVisible();
  });
});

test.describe('Telefon Numaraları — veri sadakati @data', () => {
  test('GET /dids çağrılıyor + numara tablosu render ediliyor', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes(META.api) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.voiceSub(KEY).open();
    await resP;
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Telefon Numaraları — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(META.i18n)) {
    test(`[${code}] başlık + yön + alt başlık çevrili`, async ({ app }) => {
      const d = app.voiceSub(KEY);
      await d.open();
      if (t.endonym) await d.switchLanguage(t.endonym);
      await expect(d.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(d.page.getByRole('heading', { name: t.heading, exact: true }).first()).toBeVisible();
      await expect(d.subtitle(code)).toBeVisible();
    });
  }
});

test.describe('Telefon Numaraları — erişilebilirlik @a11y', () => {
  test('ciddi/kritik a11y ihlali yok (bilinen borç hariç)', async ({ app }) => {
    const d = app.voiceSub(KEY);
    await d.open();
    await waitForUiToSettle(d.page);
    await expectNoSevereA11y(d.page);
  });
});

test.describe('Telefon Numaraları — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, META.path);
  });
});

test.describe('Telefon Numaraları — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    await app.voiceSub(KEY).open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('Telefon Numaraları — "Request Number" dialogu (salt-okunur L1 + klavye) @regression @keyboard', () => {
  test('L1: "Request Number" tıklanınca "Request Phone Number" dialogu açılıyor; klavye ile kapanıyor (gönderilmez)', async ({ app }) => {
    const d = app.voiceSub(KEY);
    await d.open();
    await d.page.getByRole('button', { name: 'Request Number', exact: true }).click();
    const dialog = d.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Request Phone Number' })).toBeVisible();
    // @keyboard: odak-tuzağı + Escape ile kapanır (talep GÖNDERİLMEZ → prod'a yazma yok).
    await expectDialogKeyboard(d.page, dialog);
  });
});

test.describe('Telefon Numaraları — hata-yolu @errorpath', () => {
  test('GET /dids 500 dönse de kabuk + başlık sağlam', async ({ app, page }) => {
    await mockApi(page, '**/api/v1/dids', { status: 500 });
    const d = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(d.shell.loginHeading).toBeHidden();
    await expect(d.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Telefon Numaraları — deep-link @deeplink', () => {
  test('/voice/dids doğrudan açılınca yükleniyor (RSC yarışı toleranslı)', async ({ app, page }) => {
    const d = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(d.shell.loginHeading).toBeHidden();
    await expect(d.heading).toBeVisible({ timeout: 30000 });
  });
});
