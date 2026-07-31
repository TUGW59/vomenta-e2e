// @ts-check
import { test, expect } from './fixtures/test.js';
import { WorkforceSchedulesPage } from './pages/WorkforceSchedulesPage.js';

/**
 * İŞ GÜCÜ › PROGRAMLAR (`/workforce/schedules`) — L1 + L2 salt-okunur (dedicated route).
 *
 * Eski `/workforce` sekmeli yüzeyinin "Programlar" sekmesi zaten
 * `tests/workforce.authed.spec.js` ile kapsanıyor (paralel, korunuyor). Bu spec yalnız
 * YENİ ayrı rotayı doğrular: standalone başlık + kontrollerin varlığı + doğru API ucu.
 * Derin hafta-nav/publish yaşam döngüsü TEKRARLANMAZ (uzlaştırma).
 */
test.describe('Programlar (dedicated route) — yapı + kontroller @regression', () => {
  test('L1: standalone sayfa yükleniyor + hafta nav + Programı Yayınla görünür', async ({
    app,
  }) => {
    const s = app.workforceSchedules;
    await s.open();
    // Standalone başlık "Programlar" (eski tabbed yüzeyin "İş Gücü Yönetimi"nden farklı).
    await expect(s.heading).toHaveText(WorkforceSchedulesPage.L.heading);
    await expect(s.prevWeekButton()).toBeVisible();
    await expect(s.nextWeekButton()).toBeVisible();
    await expect(s.publishButton()).toBeVisible();
  });

  test('L2 arka plan OK: sayfa açılışında haftalık çizelge API\'den çekiliyor @critical', async ({
    app,
    page,
  }) => {
    const s = app.workforceSchedules;
    const schedulesGet = page.waitForResponse(
      (r) =>
        r.request().method() === 'GET' &&
        r.url().includes(WorkforceSchedulesPage.API.schedules) &&
        r.ok(),
      { timeout: 30000 }
    );
    await s.open();
    expect((await schedulesGet).ok()).toBeTruthy();
  });
});
