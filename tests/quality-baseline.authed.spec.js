// @ts-check
import { test, expect } from './fixtures/test.js';
import { MAIN_NAVIGATION } from './contracts/navigation.js';
import {
  assertDestinationLoaded,
  expectNoOverflowAtViewports,
  expectNoSevereA11y,
  gotoApp,
  waitForUiToSettle,
} from './helpers.js';

/**
 * Ana navigasyondaki HER rota için kaçışı olmayan ortak kalite tabanı.
 *
 * `[route:…]` işareti tools/style-coverage.mjs tarafından makine-okur rota kanıtı
 * olarak kullanılır. Bir rotanın etiketi başka bir rotayı yeşile çeviremez.
 * Feature'a özgü L1/L2/L3 testlerinin yerine geçmez; ortak minimumu garanti eder.
 */
for (const route of MAIN_NAVIGATION) {
  test.describe(`[route:${route.path}] ${route.name}`, () => {
    test.describe.configure({ timeout: 180_000 });
    test('yapı ve doğrudan erişim çalışıyor @smoke @deeplink', async ({ page }) => {
      await gotoApp(page, route.path);
      await assertDestinationLoaded(page, {
        path: route.path,
        heading: route.heading,
      });
    });

    test('bilinen borç dışında ciddi/kritik ihlal yok @a11y', async ({ page }) => {
      await gotoApp(page, route.path);
      await waitForUiToSettle(page);
      await expectNoSevereA11y(page);
    });

    test('LTR ve Arapça RTL görünüm mobil/tablet/masaüstünde taşmıyor @layout', async ({ page }) => {
      await expectNoOverflowAtViewports(page, route.path);
    });

    test('yüklemede console, ağ veya HTTP 5xx hatası yok @clean', async ({ page, diagnostics }) => {
      await gotoApp(page, route.path);
      await waitForUiToSettle(page);
      diagnostics.assertClean();
    });

    for (const locale of [
      { code: 'en', endonym: null, dir: 'ltr' },
      { code: 'tr', endonym: 'Türkçe', dir: 'ltr' },
      { code: 'fr', endonym: 'Français', dir: 'ltr' },
      { code: 'ar', endonym: 'العربية', dir: 'rtl' },
    ]) {
      test(`${locale.code} dil/yön kabuğu çalışıyor @i18n`, async ({ app, page }) => {
        await gotoApp(page, route.path);
        if (locale.endonym) await app.shell.switchLanguage(locale.endonym);
        await expect(app.shell.languageTrigger()).toContainText(locale.endonym || 'English');
        await expect
          .poll(() => page.evaluate(() => getComputedStyle(document.body).direction))
          .toBe(locale.dir);
        await expect(page.getByRole('heading').first()).toBeVisible();
      });
    }

    test('interaktif kontrol envanteri erişilebilir isim taşıyor @regression', async ({ page }) => {
      await gotoApp(page, route.path);
      await waitForUiToSettle(page);
      const controls = page.getByRole('button').or(page.getByRole('link')).or(page.getByRole('tab'));
      await expect(controls.first()).toBeVisible();
      const unnamed = await controls.evaluateAll((nodes) =>
        nodes
          .filter((node) => node.getClientRects().length > 0)
          .filter((node) => {
            const text =
              node.getAttribute('aria-label') ||
              node.textContent ||
              node.querySelector('img')?.getAttribute('alt');
            return !String(text || '').trim();
          })
          .map((node) => node.outerHTML.slice(0, 300))
      );
      expect(unnamed, 'isimsiz interaktif kontrol bulunmamalı').toEqual([]);
    });
  });
}
