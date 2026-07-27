// @ts-check
import { test, expect } from './fixtures/test.js';
import { credentialsFor } from '../config/environment.js';
import { login } from './helpers.js';

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
    const { email, password } = credentialsFor('default');

    // Taze giriş
    await login(page, email, password);

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
