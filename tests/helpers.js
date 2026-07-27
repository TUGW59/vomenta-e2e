// @ts-check
import { expect } from '@playwright/test';

/**
 * Ortak test yardımcıları.
 */

/**
 * SPA sayfasına sağlam şekilde git.
 * 'commit' beklemesi: SPA yönlendirmelerinde navigasyonun iptal olmasını önler ve
 * ağır kaynakları beklemez; ardından DOM'un yerleşmesi beklenir.
 * @param {import('@playwright/test').Page} page
 * @param {string} path - Örn. '/contacts'
 */
export async function gotoApp(page, path) {
  await page.goto(path, { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

/**
 * Giriş sayfası üzerinden UI ile giriş yapar ve panelin yüklendiğini doğrular.
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
export async function login(page, email, password) {
  await page.goto('/');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  // Giriş başarılıysa "Welcome back" başlığı kaybolur.
  await expect(
    page.getByRole('heading', { name: 'Welcome back' })
  ).toBeHidden({ timeout: 30000 });
}
