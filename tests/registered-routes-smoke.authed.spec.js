// @ts-check
import { test, expect } from './fixtures/test.js';
import {
  REGISTERED_ROUTES,
  routeBaselineTitle,
} from './contracts/registered-routes.js';
import { assertDestinationLoaded, gotoApp } from './helpers.js';
import { AppShell } from './pages/AppShell.js';

/**
 * WP-MORNING Faz 1 — KAYITLI HER ROTA için tek read-only açılış tabanı.
 *
 * Bu, derin fonksiyon kapsamı DEĞİLDİR: her sayfanın DOĞRUDAN açılabildiğini ve
 * yanlış fallback (login / kök '/' Dashboard / 404 / 5xx) ile sonuçlanmadığını
 * kanıtlar. Feature'a özgü L1/L2/L3 testlerinin yerine geçmez; MAIN_NAVIGATION'ın
 * derin `quality-baseline`'ı da korunur (bu onun yerine geçmez).
 *
 * Her testin başlığı makine-okur `[route:/path]` işareti + `@route-baseline` etiketi
 * taşır (bkz. routeBaselineTitle). tools/self-check-routes-baseline.mjs bu işaretlerle
 * envanter ↔ seçilen test birebirliğini (eksik/fazla/yinelenen yok) sert kapıyla zorlar.
 *
 * Read-only sözleşmesi: hiçbir forma veri yazılmaz, hiçbir aksiyon butonuna tıklanmaz;
 * yalnız doğrudan navigasyon + görünürlük + rota/hedef + oturum kontrolleri yapılır.
 * `diagnostics` fixture'ı (auto) yükleme sırasındaki console-error / başarısız istek /
 * HTTP 5xx olaylarını toplar ve başarısızlıkta maskeli kanıt olarak ekler.
 */
test.describe('kayıtlı rota read-only baseline', () => {
  test.describe.configure({ timeout: 90_000 });

  for (const route of REGISTERED_ROUTES) {
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
});
