// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Vomenta giriş (login) sayfası testleri.
 * baseURL playwright.config.js içinde https://app.vomenta.com olarak ayarlıdır,
 * bu yüzden page.goto('/') doğrudan giriş sayfasını açar.
 */
test.describe('Vomenta - Giriş sayfası', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('doğru sayfa başlığı ile yükleniyor', async ({ page }) => {
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

  test('giriş formu tüm temel alanları içeriyor', async ({ page }) => {
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
});
