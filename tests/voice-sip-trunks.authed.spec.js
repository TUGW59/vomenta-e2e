// @ts-check
import { test, expect } from './fixtures/test.js';
import { VoiceSubPage } from './pages/VoiceSubPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
  knownBugGuard,
} from './helpers.js';

/**
 * VOICE › SIP Hatları (`/voice/sip-trunks`) — YENİ keşfedilen rota (alt-nav'da; hiç test edilmemişti).
 * Keşif + kanıt: docs/sesli-kesif/NOTLAR.md (2–3 Ağu 2026, app.vomenta.com).
 * SIP trunk listesi (boş-durum "No SIP Trunks") + "Add SIP Trunk" (dialog). `GET /voice/sip-trunks`.
 * Konsol + a11y temiz. YENİ BULGU VOICE-SIP-TRUNKS-SUBTITLE-I18N: alt-başlık tr/fr/ar'da çevrilmiyor.
 * GÜVENLİK (production salt-okunur): Add SIP Trunk ASLA gönderilmez (mutation → staging).
 */
const KEY = 'sip-trunks';
const META = VoiceSubPage.SECTIONS[KEY];

test.describe('SIP Hatları — yapı @smoke', () => {
  test('sayfa "SIP Trunks" başlığı + "Add SIP Trunk" ile açılıyor', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    await expect(v.page.getByRole('button', { name: 'Add SIP Trunk', exact: true }).first()).toBeVisible();
  });
});

test.describe('SIP Hatları — veri sadakati @data', () => {
  test('GET /voice/sip-trunks çağrılıyor', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes(META.api) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.voiceSub(KEY).open();
    await resP;
  });
});

// @i18n baseline: BAŞLIK + yön çevrili (alt-başlık ayrı known-bug ile — çevrilmiyor).
test.describe("SIP Hatları — 4 dil başlık guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(META.i18n)) {
    test(`[${code}] başlık + yön çevrili`, async ({ app }) => {
      const v = app.voiceSub(KEY);
      await v.open();
      if (t.endonym) await v.switchLanguage(t.endonym);
      await expect(v.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(v.page.getByRole('heading', { name: t.heading, exact: true }).first()).toBeVisible();
    });
  }
});

// @i18n — VOICE-SIP-TRUNKS-SUBTITLE-I18N: alt-başlık tr/fr/ar'da İngilizce kalıyor.
// i18n hidrasyon zamanlamasına bağlı olabildiğinden B14/AI-PROMPTS-CONSOLE deseni:
// İngilizce alt-başlık TR'de hâlâ görünüyorsa (reproduce) knownBugGuard beklenen-başarısızlık;
// görünmüyorsa test.skip.
test.describe('SIP Hatları — alt-başlık çevirisi @i18n @known-bug', () => {
  test('VOICE-SIP-TRUNKS-SUBTITLE-I18N · /voice/sip-trunks · alt-başlık seçili dile çevrilmeli', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    await v.switchLanguage('Türkçe');
    await waitForUiToSettle(v.page);
    const enSubtitleStillShown = await v.page.getByText(META.i18n.en.subtitle, { exact: false }).count();
    test.skip(enSubtitleStillShown === 0, 'Bu koşuda İngilizce alt-başlık TR\'de görünmedi (i18n çeviri sızıntısı reproduce olmadı).');

    knownBugGuard(test, 'VOICE-SIP-TRUNKS-SUBTITLE-I18N');
    // Beklenen: TR alt-başlık İngilizce string OLMAMALI. Gerçek: İngilizce kalıyor → beklenen-başarısızlık.
    await expect(v.page.getByText(META.i18n.en.subtitle, { exact: false })).toHaveCount(0);
  });
});

test.describe('SIP Hatları — erişilebilirlik @a11y', () => {
  test('ciddi/kritik a11y ihlali yok (bilinen borç hariç)', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    await waitForUiToSettle(v.page);
    await expectNoSevereA11y(v.page);
  });
});

test.describe('SIP Hatları — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, META.path);
  });
});

test.describe('SIP Hatları — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    await app.voiceSub(KEY).open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('SIP Hatları — "Add SIP Trunk" dialogu (salt-okunur L1 + klavye) @regression @keyboard', () => {
  test('L1: "Add SIP Trunk" tıklanınca dialog açılıyor; klavye ile kapanıyor (gönderilmez)', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    await v.page.getByRole('button', { name: 'Add SIP Trunk', exact: true }).first().click();
    const dialog = v.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expectDialogKeyboard(v.page, dialog);
  });
});

test.describe('SIP Hatları — hata-yolu @errorpath', () => {
  test('GET /voice/sip-trunks 500 dönse de kabuk + başlık sağlam', async ({ app, page }) => {
    await mockApi(page, '**/api/v1/voice/sip-trunks**', { status: 500 });
    const v = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(v.shell.loginHeading).toBeHidden();
    await expect(v.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('SIP Hatları — deep-link @deeplink', () => {
  test('/voice/sip-trunks doğrudan açılınca yükleniyor', async ({ app, page }) => {
    const v = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(v.shell.loginHeading).toBeHidden();
    await expect(v.heading).toBeVisible({ timeout: 30000 });
  });
});
