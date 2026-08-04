// @ts-check
import { test, expect } from './fixtures/test.js';
import {
  RUNNABLE_ROUTES,
  BLOCKED_ROUTES,
  REDIRECT_ROUTES,
  routeBaselineTitle,
  routeBlockedTitle,
  routeRedirectTitle,
} from './contracts/registered-routes.js';
import { assertDestinationLoaded, gotoApp } from './helpers.js';
import { AppShell } from './pages/AppShell.js';

/**
 * WP-MORNING Faz 1 + WP-SURFACE-MIGRATION (FAZ 3) — KANONİK HER YÜZEY için
 * runtime-policy'ye göre tek read-only baseline.
 *
 * Rota evreni artık `PRODUCT_SURFACES`'ten türetilir (bkz. registered-routes.js).
 * Kapsam sözleşmesi OLMAYAN ürün yüzeyleri de burada görünür: baseline testi alır ve
 * matriste `NO_COVERAGE_CONTRACT` olarak dürüstçe raporlanır — sessizce kaybolmaz.
 *
 * RUNTIME BASELINE POLİTİKASI (fail-closed; sahte PASS üretmez):
 *   - RUNNABLE (readonly-baseline): sayfanın DOĞRUDAN açıldığını ve yanlış fallback
 *     (login / kök '/' Dashboard / 404 / 5xx) ile sonuçlanmadığını kanıtlar. Başlık
 *     makine-okur `[route:/path] @route-baseline` işareti taşır.
 *   - BLOCKED (fixture-required / readonly-blocked / staging-only): güvenli read-only
 *     ön koşulu YOK → `test.fixme` ile ÜRETİLİR (asla koşmaz, asla PASS olmaz). Başlık
 *     reason code + `@route-blocked` işareti taşır. Yüzey görünür ama yeşile boyanmaz.
 *   - REDIRECT (routeKind=redirect): kaynak→hedef yönlendirmesini doğrular (sessiz
 *     kök '/' PASS değil). Başlık `@route-redirect` işareti taşır.
 *
 * `tools/self-check-routes-baseline.mjs` bu işaretlerle envanter ↔ seçilen test
 * birebirliğini (baseline/blocked/redirect ayrık, eksik/fazla/yinelenen yok) zorlar.
 *
 * Read-only sözleşmesi: hiçbir forma veri yazılmaz, hiçbir aksiyon butonuna tıklanmaz;
 * yalnız doğrudan navigasyon + görünürlük + rota/hedef + oturum kontrolleri yapılır.
 */
test.describe('kayıtlı rota read-only baseline', () => {
  test.describe.configure({ timeout: 90_000 });

  // ── RUNNABLE: gerçek read-only açılış tabanı ──────────────────────────────
  for (const route of RUNNABLE_ROUTES) {
    test(routeBaselineTitle(route.path), async ({ page }) => {
      const shell = new AppShell(page);

      // 1) Rota doğrudan açılır + oturum korunur (kabuk hazır, login gizli).
      await gotoApp(page, route.path);

      if (route.heading) {
        // Başlığı bilinen (MAIN_NAVIGATION) rota: doğru rota + login değil + beklenen
        // başlık gerçekten render oldu. Salt URL eşleşmesi yeterli değildir.
        await assertDestinationLoaded(page, { path: route.path, heading: route.heading });
      } else {
        // Derin rota: başlık BİLİNMİYOR → uydurma. URL doğru + login değil + temel
        // görünür yüzey (herhangi bir başlık) yüklendi.
        await page.waitForURL((url) => url.pathname.startsWith(route.path), { timeout: 15_000 });
        await expect(shell.loginHeading).toBeHidden();
        await expect(page.getByRole('heading').first()).toBeVisible();
      }

      // 2) Kök '/' fallback'ine sessiz düşmedi (hedef '/' ise bu kontrol uygulanmaz).
      if (route.path !== '/') {
        const pathname = new URL(page.url()).pathname;
        expect(
          pathname,
          `"${route.path}" beklenmedik kök '/' (Dashboard) fallback'ine düştü`
        ).not.toBe('/');
      }
    });
  }

  // ── BLOCKED: ön koşul yok → koşulmaz (test.fixme; asla PASS değil) ─────────
  for (const route of BLOCKED_ROUTES) {
    const reason = route.blockedReason || route.runtimePolicy;
    test.fixme(routeBlockedTitle(route.path, reason), async () => {
      // Kasıtlı olarak koşulmaz: fixture-required/readonly-blocked/staging-only yüzeyi
      // production read-only'de güvenle açılamaz. Yüzey envanterde ve matriste görünür,
      // ama sahte PASS ÜRETMEZ. Ön koşul (güvenli fixture ID / rol / staging tenant)
      // sağlandığında ilgili dalgada gerçek test yazılır (HANDOFF FAZ 6).
    });
  }

  // ── REDIRECT: kaynak→hedef doğrulanır (sessiz PASS değil) ──────────────────
  for (const route of REDIRECT_ROUTES) {
    test(routeRedirectTitle(route.path, route.redirectTarget || ''), async ({ page }) => {
      const shell = new AppShell(page);
      await gotoApp(page, route.path);
      await expect(shell.loginHeading).toBeHidden();
      // Kaynak rota tanımlı hedefe yönlendirmeli (redirectTarget registry'de doğrulanır).
      await page.waitForURL(
        (url) => url.pathname === route.redirectTarget || url.pathname.startsWith(route.redirectTarget),
        { timeout: 15_000 }
      );
    });
  }
});
