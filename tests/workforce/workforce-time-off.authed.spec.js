// @ts-check
import { test, expect } from '../fixtures/test.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
} from '../helpers.js';
import { WorkforceTimeOffPage } from '../pages/WorkforceTimeOffPage.js';

/**
 * İŞ GÜCÜ › İZİNLER (`/workforce/time-off`) — L1 + L2 salt-okunur (dedicated route)
 * + zorunlu test stilleri.
 *
 * Eski `/workforce` sekmeli yüzeyinin "İzinler" sekmesi zaten
 * `tests/workforce.authed.spec.js` ile kapsanıyor (paralel, korunuyor). Bu spec yalnız
 * YENİ ayrı rotayı doğrular: standalone başlık + "İzin talep et" formu (L1) + liste API (L2).
 * L3 = N/A (izin talebi UI'dan silinemiyor; terminal durumda yalnız durum değişir →
 * güvenli teardown yok) → mutation kapsamı dışı (hasWrites:false).
 */
const LANGS = [
  { code: 'en', endonym: null, dir: 'ltr' },
  { code: 'tr', endonym: 'Türkçe', dir: 'ltr' },
  { code: 'fr', endonym: 'Français', dir: 'ltr' },
  { code: 'ar', endonym: 'العربية', dir: 'rtl' },
];

test.describe('İzinler (dedicated route) — yapı + kontroller @smoke @regression', () => {
  test('L1: standalone sayfa + "İzin talep et" formu açılıyor', async ({ app }) => {
    const t = app.workforceTimeOff;
    await t.open();
    await expect(t.heading).toHaveText(WorkforceTimeOffPage.L.heading);
    await expect(t.requestButton()).toBeVisible();

    const dialog = await t.openRequestDialog();
    await expect(dialog).toBeVisible();
    // GÖNDERİLMEZ — izin talebi kalıcı kayıt, UI'dan silinemiyor (salt L1).
    await t.page.keyboard.press('Escape');
  });

  test('L2 arka plan OK: sayfa açılışında izin listesi API\'den çekiliyor @critical', async ({
    app,
    page,
  }) => {
    const t = app.workforceTimeOff;
    const timeOffGet = page.waitForResponse(
      (r) =>
        r.request().method() === 'GET' &&
        r.url().includes(WorkforceTimeOffPage.API.timeOff) &&
        r.ok(),
      { timeout: 30000 }
    );
    await t.open();
    expect((await timeOffGet).ok()).toBeTruthy();
  });
});

// ──────────────────── 4 DİL YÖN/BAŞLIK GUARD'I (@i18n) ────────────────────
test.describe('İzinler — dil yönü/başlık @i18n', () => {
  for (const { code, endonym, dir } of LANGS) {
    test(`[${code}] doğru yazı yönü + başlık görünür`, async ({ app }) => {
      const t = app.workforceTimeOff;
      await t.open();
      if (endonym) await t.switchLanguage(endonym);
      await expect(t.page.locator('body')).toHaveCSS('direction', dir);
      await expect(t.heading).toBeVisible();
      await expect(t.heading).not.toHaveText('');
    });
  }
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('İzinler — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const t = app.workforceTimeOff;
    await t.open();
    await expectNoSevereA11y(t.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('İzinler — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/workforce/time-off');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('İzinler — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({
    app,
    diagnostics,
  }) => {
    const t = app.workforceTimeOff;
    await t.open();
    await waitForUiToSettle(t.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('İzinler — hata-yolu @errorpath', () => {
  test('izin listesi ucu 500 dönerse sayfa çökmüyor (login\'e düşmüyor)', async ({
    app,
    page,
  }) => {
    await mockApi(page, `**${WorkforceTimeOffPage.API.timeOff}**`, { status: 500 });
    const t = app.workforceTimeOff;
    await page.goto('/workforce/time-off', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(t.shell.loginHeading).toBeHidden();
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('İzinler — klavye/odak @keyboard', () => {
  test('İzin talep et diyaloğu Escape ile kapanıyor', async ({ app }) => {
    const t = app.workforceTimeOff;
    await t.open();
    const dialog = await t.openRequestDialog();
    await expect(dialog).toBeVisible();
    await t.page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('İzinler — deep-link @deeplink', () => {
  test('/workforce/time-off doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({
    app,
    page,
  }) => {
    const t = app.workforceTimeOff;
    await page.goto('/workforce/time-off', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(t.shell.loginHeading).toBeHidden();
    await expect(t.heading).toHaveText(WorkforceTimeOffPage.L.heading);
  });
});
