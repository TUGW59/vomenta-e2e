// @ts-check
import { test, expect } from '../fixtures/test.js';
import { VoiceSubPage } from '../pages/VoiceSubPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  waitForUiToSettle,
} from '../helpers.js';

/**
 * VOICE › SIP Ayarları (`/voice/sip-settings`) — YENİ keşfedilen rota (alt-nav'da; hiç test edilmemişti).
 * Keşif + kanıt: docs/sesli-kesif/NOTLAR.md (2–3 Ağu 2026, app.vomenta.com).
 * Bu iş istasyonunun SIP kaydı ayarları: SIP extension + Display name girdileri + Endpoint mode
 * (WebRTC softphone / SIP desk phone). Ayarlar TARAYICIDA (localStorage) saklanır — sunucu API'si
 * YOK, tenant verisi değişmez. Konsol + a11y temiz.
 * GÜVENLİK: sayfada Save/gönder yok; girdi doldurma yalnız yerel (localStorage, geçici bağlam) → prod tenant'a yazma YOK.
 */
const KEY = 'sip-settings';
const META = VoiceSubPage.SECTIONS[KEY];

test.describe('SIP Ayarları — yapı @smoke', () => {
  test('sayfa "SIP & phone settings" + SIP extension/Display name alanları ile açılıyor', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    await expect(v.page.getByPlaceholder('e.g. 1001')).toBeVisible();
    await expect(v.page.getByText('Display name', { exact: true }).first()).toBeVisible();
  });
});

test.describe("SIP Ayarları — 4 dil başlık guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(META.i18n)) {
    // Alt-başlık iki paragraflı/kararsız → yalnız başlık + yön doğrulanır.
    test(`[${code}] başlık + yön çevrili`, async ({ app }) => {
      const v = app.voiceSub(KEY);
      await v.open();
      if (t.endonym) await v.switchLanguage(t.endonym);
      await expect(v.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(v.page.getByRole('heading', { name: t.heading, exact: true }).first()).toBeVisible();
    });
  }
});

test.describe('SIP Ayarları — erişilebilirlik @a11y', () => {
  test('ciddi/kritik a11y ihlali yok (bilinen borç hariç)', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    await waitForUiToSettle(v.page);
    await expectNoSevereA11y(v.page);
  });
});

test.describe('SIP Ayarları — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, META.path);
  });
});

test.describe('SIP Ayarları — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    await app.voiceSub(KEY).open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

// @regression — SIP extension girdisi (yerel/localStorage; sunucuya yazmaz). L1: değer girilebiliyor + yansıyor.
test.describe('SIP Ayarları — SIP extension girdisi (yerel L1) @regression', () => {
  test('L1: "SIP extension" alanına değer girilebiliyor ve yansıyor (yalnız localStorage, sunucuya yazmaz)', async ({ app }) => {
    const v = app.voiceSub(KEY);
    await v.open();
    const ext = v.page.getByPlaceholder('e.g. 1001');
    await ext.fill('1001');
    await expect(ext).toHaveValue('1001');
  });
});

test.describe('SIP Ayarları — deep-link @deeplink', () => {
  test('/voice/sip-settings doğrudan açılınca yükleniyor', async ({ app, page }) => {
    const v = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(v.shell.loginHeading).toBeHidden();
    await expect(v.heading).toBeVisible({ timeout: 30000 });
  });
});
