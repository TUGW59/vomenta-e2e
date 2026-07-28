// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * Duyarlı (responsive) düzen testi — mobil görünümde uygulama kabuğu doğru uyarlanıyor mu.
 * Mobilde masaüstü kenar menüsü gizlenir ve yerine "Open menu" (hamburger) gelir.
 *
 * Not: gotoApp/AppShell.expectReady kenar menüsünün GÖRÜNÜR olmasını bekler; mobilde menü
 * gizli olduğundan burada doğrudan gezinip login'den çıktığımızı kendimiz doğruluyoruz.
 */
test.use({ viewport: { width: 375, height: 812 } });

test.describe('Vomenta - Mobil görünüm (responsive)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    // Oturum geçerli — login sayfasında değiliz.
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeHidden({ timeout: 30000 });
  });

  test('mobilde masaüstü kenar menüsü gizli', async ({ page }) => {
    await expect(page.locator('nav').first()).toBeHidden();
  });

  test('mobilde hamburger (Open menu) butonu görünür', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
  });
});
