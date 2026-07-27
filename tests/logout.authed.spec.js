// @ts-check
import { test, expect } from '@playwright/test';
import { login } from './helpers';

/**
 * Çıkış (logout) akışı testi.
 *
 * ÖNEMLİ: Bu test paylaşılan kayıtlı oturumu (playwright/.auth/user.json) KULLANMAZ.
 * Kendi taze girişini yapıp çıkış yapar — böylece çıkış, diğer girişli testlerin
 * kullandığı oturumu geçersiz kılmaz.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Vomenta - Çıkış (logout)', () => {
  test('kullanıcı menüsünden çıkış yapılabiliyor', async ({ page }) => {
    const email = process.env.VOMENTA_EMAIL;
    const password = process.env.VOMENTA_PASSWORD;
    test.skip(!email || !password, 'VOMENTA_EMAIL / VOMENTA_PASSWORD .env içinde tanımlı değil');

    // Taze giriş
    await login(page, String(email), String(password));

    // Kullanıcı menüsünü aç ve çıkış yap
    const userMenu = page.getByRole('button', { name: 'User menu' });
    await expect(userMenu).toBeVisible({ timeout: 30000 });
    await userMenu.click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();

    // Tekrar giriş sayfasına dönmeliyiz
    await expect(
      page.getByRole('heading', { name: 'Welcome back' })
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByLabel('Password')).toBeVisible();
  });
});
