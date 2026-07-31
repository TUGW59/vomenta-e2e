// @ts-check
import { test, expect } from './fixtures/test.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';
import { WorkforceSchedulesPage } from './pages/WorkforceSchedulesPage.js';

/**
 * İŞ GÜCÜ › PROGRAMLAR (`/workforce/schedules`) — L1 + L2 salt-okunur (dedicated route)
 * + zorunlu test stilleri.
 *
 * Eski `/workforce` sekmeli yüzeyinin "Programlar" sekmesi zaten
 * `tests/workforce.authed.spec.js` ile kapsanıyor (paralel, korunuyor). Bu spec yalnız
 * YENİ ayrı rotayı doğrular: standalone başlık + kontrollerin varlığı + doğru API ucu.
 * Derin hafta-nav/publish yaşam döngüsü + vardiya mutasyonu /workforce yüzeyinde
 * (workforce.authed.spec.js + workforce-mutations.authed.spec.js) sahiplenilir → burada
 * TEKRARLANMAZ (uzlaştırma). Bu yüzden bu rota salt-okunur (hasWrites:false).
 */
const LANGS = [
  { code: 'en', endonym: null, dir: 'ltr' },
  { code: 'tr', endonym: 'Türkçe', dir: 'ltr' },
  { code: 'fr', endonym: 'Français', dir: 'ltr' },
  { code: 'ar', endonym: 'العربية', dir: 'rtl' },
];

test.describe('Programlar (dedicated route) — yapı + kontroller @smoke @regression', () => {
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

// ──────────────────── 4 DİL YÖN/BAŞLIK GUARD'I (@i18n) ────────────────────
test.describe('Programlar — dil yönü/başlık @i18n', () => {
  for (const { code, endonym, dir } of LANGS) {
    test(`[${code}] doğru yazı yönü + başlık görünür`, async ({ app }) => {
      const s = app.workforceSchedules;
      await s.open();
      if (endonym) await s.switchLanguage(endonym);
      await expect(s.page.locator('body')).toHaveCSS('direction', dir);
      await expect(s.heading).toBeVisible();
      await expect(s.heading).not.toHaveText('');
    });
  }
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Programlar — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const s = app.workforceSchedules;
    await s.open();
    await expectNoSevereA11y(s.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Programlar — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/workforce/schedules');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Programlar — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({
    app,
    diagnostics,
  }) => {
    const s = app.workforceSchedules;
    await s.open();
    await waitForUiToSettle(s.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Programlar — hata-yolu @errorpath', () => {
  test('çizelge ucu 500 dönerse sayfa çökmüyor (login\'e düşmüyor)', async ({
    app,
    page,
  }) => {
    await mockApi(page, `**${WorkforceSchedulesPage.API.schedules}**`, { status: 500 });
    const s = app.workforceSchedules;
    await page.goto('/workforce/schedules', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(s.shell.loginHeading).toBeHidden();
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Programlar — deep-link @deeplink', () => {
  test('/workforce/schedules doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({
    app,
    page,
  }) => {
    const s = app.workforceSchedules;
    await page.goto('/workforce/schedules', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(s.shell.loginHeading).toBeHidden();
    await expect(s.heading).toHaveText(WorkforceSchedulesPage.L.heading);
  });
});
