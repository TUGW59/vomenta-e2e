// @ts-check
import { test } from './fixtures/test.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { assertDestinationLoaded, gotoApp } from './helpers.js';

/**
 * Dashboard hızlı eylem GEZİNME linklerinin FONKSİYONEL testi — tıklayınca doğru
 * sayfaya götürüyor mu. Bunlar birer link; yalnızca GEZİNME yaparlar (veri göndermez).
 * ("Start Call" bir buton olup softphone açar → dashboard.authed.spec.js'de test edilir.)
 *
 * L2 arka plan: N/A — istemci-taraflı SPA gezinmesi (linkin kendine ait uç isteği yok).
 * L3: yalnızca URL değil, hedef sayfanın başlığı da görünür olmalı (assertDestinationLoaded).
 */
test.describe('Gösterge Paneli — hızlı eylemler (gezinme) @regression', () => {
  for (const action of DashboardPage.QUICK_LINKS) {
    test(`L1+L3: "${action.name}" ${action.path} ("${action.heading}") sayfasına götürüyor`, async ({ page }) => {
      await gotoApp(page, '/');
      await page.getByRole('link', { name: action.name, exact: true }).click();
      await assertDestinationLoaded(page, { path: action.path, heading: action.heading });
    });
  }
});
