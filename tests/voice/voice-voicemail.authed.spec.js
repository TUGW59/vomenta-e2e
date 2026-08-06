// @ts-check
import { test, expect } from '../fixtures/test.js';
import { VoiceSubPage } from '../pages/VoiceSubPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
  knownBugGuard,
} from '../helpers.js';

/**
 * VOICE › Sesli Mesajlar (`/voice/voicemail`).
 * Keşif + kanıt: docs/sesli-kesif/NOTLAR.md (2 Ağu 2026, app.vomenta.com).
 * "All Status" filtresi + sesli mesaj tablosu + Mark All Read + satır Play/Transcribe/
 * Delete/Mark as Read. `GET /api/v1/voicemails`.
 * YENİ BULGU VOICEMAIL-PAGER-I18N: açılışta konsol MISSING_MESSAGE common.previousPage/nextPage.
 * GÜVENLİK (production salt-okunur): Delete/Mark Read ASLA tetiklenmez (destructive → staging).
 */
const KEY = 'voicemail';
const META = VoiceSubPage.SECTIONS[KEY];

test.describe('Sesli Mesajlar — yapı @smoke', () => {
  test('sayfa "Voicemails" başlığı + alt-başlık ile açılıyor', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    await expect(v.subtitle('en')).toBeVisible();
  });
});

test.describe('Sesli Mesajlar — veri sadakati @data', () => {
  test('GET /voicemails çağrılıyor + tablo render ediliyor', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes(META.api) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.voiceSub(KEY).open();
    await resP;
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Sesli Mesajlar — 4 dil çeviri guard'ları @i18n", () => {
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

test.describe('Sesli Mesajlar — erişilebilirlik @a11y', () => {
  test('ciddi/kritik a11y ihlali yok (bilinen borç hariç)', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    await waitForUiToSettle(v.page);
    await expectNoSevereA11y(v.page);
  });
});

test.describe('Sesli Mesajlar — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, META.path);
  });
});

// @clean — VOICEMAIL-PAGER-I18N bilinen hatası: açılışta pagination ham i18n anahtarı
// (common.previousPage/nextPage MISSING_MESSAGE) konsola basılıyor → sayfa temiz DEĞİL.
test.describe('Sesli Mesajlar — console temizliği @clean @known-bug', () => {
  test('VOICEMAIL-PAGER-I18N · /voice/voicemail · açılışta ham i18n pager anahtarı / MISSING_MESSAGE olmamalı', async ({ app, diagnostics }) => {
    knownBugGuard(test, 'VOICEMAIL-PAGER-I18N');
    await app.voiceSub(KEY).open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('Sesli Mesajlar — durum filtresi (client L1) @regression', () => {
  test('L1: "All Status" filtresi açılıp seçim yapılabiliyor; sayfa sağlam', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    const filter = v.page.getByRole('combobox').first();
    await expect(filter).toBeVisible();
    await filter.click();
    const option = v.page.getByRole('option').first();
    if (await option.count()) await option.click();
    await expect(v.heading).toBeVisible();
  });
});

test.describe('Sesli Mesajlar — hata-yolu @errorpath', () => {
  test('GET /voicemails 500 dönse de kabuk + başlık sağlam', async ({ app, page }) => {
    await mockApi(page, '**/api/v1/voicemails**', { status: 500 });
    const v = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(v.shell.loginHeading).toBeHidden();
    await expect(v.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Sesli Mesajlar — deep-link @deeplink', () => {
  test('/voice/voicemail doğrudan açılınca yükleniyor', async ({ app, page }) => {
    const v = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(v.shell.loginHeading).toBeHidden();
    await expect(v.heading).toBeVisible({ timeout: 30000 });
  });
});
