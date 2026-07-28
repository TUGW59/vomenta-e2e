// @ts-check
import { test, expect } from './fixtures/test.js';
import { MAIN_NAVIGATION } from './contracts/navigation.js';
import { assertDestinationLoaded, gotoApp } from './helpers.js';

/**
 * Giriş sonrası (authenticated) Vomenta panel testleri.
 * Kayıtlı oturumu (playwright/.auth/user.json) kullanır — bkz. auth.setup.js.
 */

test.describe('Vomenta - Giriş sonrası panel', () => {
  test.beforeEach(async ({ app, page }) => {
    await page.goto('/');
    await app.shell.expectReady();
  });

  test('oturum geçerli — giriş formu görünmüyor @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeHidden();
    await expect(page.getByLabel('Password')).toBeHidden();
  });

  test('panel ve kullanıcı menüsü görünüyor @smoke @critical', async ({ app, page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(app.shell.userMenu).toBeVisible();
  });

  test('kenar menüsü tüm ana bölümleri içeriyor @critical', async ({ app }) => {
    for (const item of MAIN_NAVIGATION) {
      await expect(app.shell.link(item.name)).toBeVisible();
    }
  });

  test('menü linkleri doğru href değerlerine sahip', async ({ app }) => {
    for (const item of MAIN_NAVIGATION) {
      await expect(app.shell.link(item.name)).toHaveAttribute('href', item.path);
    }
  });

  test('arama kutusu ve tarih filtreleri görünüyor', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Search/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Today', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '7 Days', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '30 Days', exact: true })).toBeVisible();
  });
});

/**
 * Her ana sayfaya doğrudan URL ile erişim — ayrı testler halinde (paralelleşir).
 * 'commit' beklemesi: SPA yönlendirmelerinde navigasyonun iptal olmasını önler ve
 * ağır kaynakların yüklenmesini beklemez. Bazı sayfalar alt-rotaya yönlenir
 * (ör. /voice -> /voice/live), bu yüzden URL'nin istenen yolu İÇERMESİNİ bekleriz.
 *
 * L3: yalnızca oturum/URL değil, sayfanın beklenen başlığı da görünür olmalı
 * (assertDestinationLoaded — sözleşmedeki `heading`). Böylece "URL doğru ama sayfa
 * boş/bozuk" durumu yakalanır.
 */
test.describe('Vomenta - Sayfalara doğrudan erişim (oturum korunuyor)', () => {
  for (const item of MAIN_NAVIGATION.filter((i) => i.path !== '/')) {
    test(`${item.path} doğrudan açılıyor ("${item.heading}")`, async ({ page }) => {
      await gotoApp(page, item.path);
      await assertDestinationLoaded(page, { path: item.path, heading: item.heading });
    });
  }
});
