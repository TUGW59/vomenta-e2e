// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { severeA11yViolations } from './helpers.js';

/**
 * Vomenta giriş (login) sayfası testleri.
 * baseURL merkezi ortam yapılandırmasından gelir; page.goto('/') giriş sayfasını açar.
 */
test.describe('Vomenta - Giriş sayfası', () => {
  test.beforeEach(async ({ app }) => {
    await app.login.open();
  });

  test('doğru sayfa başlığı ile yükleniyor @smoke @public', async ({ page }) => {
    await expect(page).toHaveTitle(/Vomenta/i);
  });

  test('karşılama başlıkları görünüyor', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Welcome back' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Your AI-Powered Contact Center' })
    ).toBeVisible();
  });

  test('giriş formu tüm temel alanları içeriyor @smoke @public', async ({ page }) => {
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
  });

  test('SSO (Google ve Microsoft) butonları görünüyor', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Microsoft' })).toBeVisible();
  });

  test('e-posta ve şifre alanlarına yazılabiliyor', async ({ page }) => {
    const email = page.getByLabel('Email address');
    const password = page.getByLabel('Password');

    await email.fill('test.user@example.com');
    await password.fill('SuperSecret123');

    await expect(email).toHaveValue('test.user@example.com');
    await expect(password).toHaveValue('SuperSecret123');
  });

  test('e-posta alanı geçersiz adresi native doğrulama ile reddediyor', async ({ page }) => {
    const email = page.getByLabel('Email address');

    await email.fill('gecersiz-eposta');
    // type="email" olduğu için tarayıcının kısıt doğrulaması geçersiz olmalı
    expect(await email.evaluate((el) => el.checkValidity())).toBe(false);

    await email.fill('gecerli@example.com');
    expect(await email.evaluate((el) => el.checkValidity())).toBe(true);
  });

  test("'Forgot password?' linki şifre sıfırlama sayfasına gidiyor", async ({ page }) => {
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });

  test("'Sign up' linki kayıt sayfasına gidiyor", async ({ page }) => {
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('erişilebilirlik: bilinen borç dışında ciddi/kritik a11y ihlali yok @a11y', async ({ page }) => {
    const severe = await severeA11yViolations(page);
    expect(severe.map((v) => `${v.id} (${v.impact})`)).toEqual([]);
  });

  test('görsel: giriş sayfası anlık görüntüsü değişmedi @visual', async ({ page }) => {
    // Görsel baseline'lar işletim sistemine bağlı; yerelde (macOS) üretilenler CI'daki
    // Linux ile eşleşmez. CI için ayrı baseline üretilene kadar CI'da atlanır.
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });
});
