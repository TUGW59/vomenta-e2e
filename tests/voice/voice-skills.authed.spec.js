// @ts-check
import { test, expect } from '../fixtures/test.js';
import { VoiceSubPage } from '../pages/VoiceSubPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
} from '../helpers.js';

/**
 * VOICE › Beceri Tabanlı Yönlendirme (`/voice/skills`) — YENİ keşfedilen rota (alt-nav'da; hiç test edilmemişti).
 * Keşif + kanıt: docs/sesli-kesif/NOTLAR.md (2–3 Ağu 2026, app.vomenta.com).
 * "Select Queue" combobox'ı (kuyruklar `GET /api/v1/queues`'ten) → seçilen kuyruğun üyelerine
 * beceri/öncelik atama. Konsol + a11y temiz.
 * GÜVENLİK (production salt-okunur): beceri ATAMA (write) tetiklenmez; kuyruk SEÇME salt-okuma.
 */
const KEY = 'skills';
const META = VoiceSubPage.SECTIONS[KEY];

test.describe('Beceriler — yapı @smoke', () => {
  test('sayfa "Skills-Based Routing" başlığı + alt-başlık + "Select Queue" ile açılıyor', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    await expect(v.subtitle('en')).toBeVisible();
    await expect(v.page.getByRole('combobox').first()).toBeVisible();
  });
});

test.describe('Beceriler — veri sadakati @data', () => {
  test('GET /queues çağrılıyor (kuyruk seçici doldurulur)', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes(META.api) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.voiceSub(KEY).open();
    await resP;
  });
});

test.describe("Beceriler — 4 dil çeviri guard'ları @i18n", () => {
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

test.describe('Beceriler — erişilebilirlik @a11y', () => {
  test('ciddi/kritik a11y ihlali yok (bilinen borç hariç)', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    await waitForUiToSettle(v.page);
    await expectNoSevereA11y(v.page);
  });
});

test.describe('Beceriler — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, META.path);
  });
});

test.describe('Beceriler — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    await app.voiceSub(KEY).open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

// @regression — "Select Queue" combobox'ı: aç → kuyruk seçenekleri (GET /queues'ten) → seç.
// Kuyruk SEÇME salt-okuma (üye/beceri panelini yükler); beceri ATAMA staging'de.
test.describe('Beceriler — kuyruk seçici (client L1) @regression', () => {
  test('L1: "Select Queue" açılıp bir kuyruk seçilebiliyor; sayfa sağlam', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    const combo = v.page.getByRole('combobox').first();
    await expect(combo).toBeVisible();
    await combo.click();
    const option = v.page.getByRole('option').first();
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
    await expect(v.heading).toBeVisible();
  });
});

test.describe('Beceriler — hata-yolu @errorpath', () => {
  test('GET /queues 500 dönse de kabuk + başlık sağlam', async ({ app, page }) => {
    await mockApi(page, '**/api/v1/queues', { status: 500 });
    const v = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(v.shell.loginHeading).toBeHidden();
    await expect(v.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Beceriler — deep-link @deeplink', () => {
  test('/voice/skills doğrudan açılınca yükleniyor', async ({ app, page }) => {
    const v = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(v.shell.loginHeading).toBeHidden();
    await expect(v.heading).toBeVisible({ timeout: 30000 });
  });
});
