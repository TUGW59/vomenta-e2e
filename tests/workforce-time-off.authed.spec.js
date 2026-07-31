// @ts-check
import { test, expect } from './fixtures/test.js';
import { WorkforceTimeOffPage } from './pages/WorkforceTimeOffPage.js';

/**
 * İŞ GÜCÜ › İZİNLER (`/workforce/time-off`) — L1 + L2 salt-okunur (dedicated route).
 *
 * Eski `/workforce` sekmeli yüzeyinin "İzinler" sekmesi zaten
 * `tests/workforce.authed.spec.js` ile kapsanıyor (paralel, korunuyor). Bu spec yalnız
 * YENİ ayrı rotayı doğrular: standalone başlık + "İzin talep et" formu (L1) + liste API (L2).
 * L3 = N/A (izin talebi UI'dan silinemiyor) → mutation kapsamı dışı.
 */
test.describe('İzinler (dedicated route) — yapı + kontroller @regression', () => {
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
