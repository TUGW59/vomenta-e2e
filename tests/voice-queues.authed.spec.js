// @ts-check
import { test, expect } from './fixtures/test.js';
import { VoiceSubPage } from './pages/VoiceSubPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * VOICE › Kuyruklar (`/voice/queues`).
 * Keşif + kanıt: docs/sesli-kesif/NOTLAR.md (2 Ağu 2026, app.vomenta.com).
 * Kuyruk kartları listesi + "Create Queue" (dialog, 9 alan) + kart başına Settings/Delete +
 * pagination. `GET /api/v1/queues`. Canlı açılış konsolu temiz.
 * GÜVENLİK (production salt-okunur): Create/Delete Queue ASLA gönderilmez (mutation → staging).
 */
const KEY = 'queues';
const META = VoiceSubPage.SECTIONS[KEY];

test.describe('Kuyruklar — yapı @smoke', () => {
  test('sayfa "Queues" başlığı + alt-başlık + "Create Queue" ile açılıyor', async ({ app }) => {
    const q = app.voiceSub(KEY);
    await q.open();
    await expect(q.subtitle('en')).toBeVisible();
    await expect(q.page.getByRole('button', { name: 'Create Queue', exact: true })).toBeVisible();
  });
});

test.describe('Kuyruklar — veri sadakati @data', () => {
  test('GET /queues çağrılıyor + en az bir kuyruk kartı render ediliyor', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes(META.api) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.voiceSub(KEY).open();
    await resP;
    // Kart başına yönetim düğmesi ("… Queue Settings") → liste gerçekten render oldu.
    await expect(page.getByRole('button', { name: /Queue Settings$/ }).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Kuyruklar — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(META.i18n)) {
    test(`[${code}] başlık + yön + alt başlık çevrili`, async ({ app }) => {
      const q = app.voiceSub(KEY);
      await q.open();
      if (t.endonym) await q.switchLanguage(t.endonym);
      await expect(q.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(q.page.getByRole('heading', { name: t.heading, exact: true }).first()).toBeVisible();
      await expect(q.subtitle(code)).toBeVisible();
    });
  }
});

test.describe('Kuyruklar — erişilebilirlik @a11y', () => {
  test('ciddi/kritik a11y ihlali yok (bilinen borç hariç)', async ({ app }) => {
    const q = app.voiceSub(KEY);
    await q.open();
    await waitForUiToSettle(q.page);
    await expectNoSevereA11y(q.page);
  });
});

test.describe('Kuyruklar — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, META.path);
  });
});

test.describe('Kuyruklar — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    await app.voiceSub(KEY).open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('Kuyruklar — "Create Queue" dialogu (salt-okunur L1 + klavye) @regression @keyboard', () => {
  test('L1: "Create Queue" tıklanınca dialog açılıyor; klavye ile kapanıyor (gönderilmez)', async ({ app }) => {
    const q = app.voiceSub(KEY);
    await q.open();
    await q.page.getByRole('button', { name: 'Create Queue', exact: true }).click();
    const dialog = q.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Create Queue' })).toBeVisible();
    // @keyboard: odak-tuzağı + Escape ile kapanır (form GÖNDERİLMEZ → prod'a yazma yok).
    await expectDialogKeyboard(q.page, dialog);
  });
});

test.describe('Kuyruklar — hata-yolu @errorpath', () => {
  test('GET /queues 500 dönse de kabuk + başlık sağlam', async ({ app, page }) => {
    await mockApi(page, '**/api/v1/queues', { status: 500 });
    const q = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(q.shell.loginHeading).toBeHidden();
    await expect(q.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Kuyruklar — deep-link @deeplink', () => {
  test('/voice/queues doğrudan açılınca yükleniyor', async ({ app, page }) => {
    const q = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(q.shell.loginHeading).toBeHidden();
    await expect(q.heading).toBeVisible({ timeout: 30000 });
  });
});
