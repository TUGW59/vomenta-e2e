// @ts-check
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

/**
 * Vomenta'ya bir kez giriş yapar ve oturumu (cookies + localStorage) diske kaydeder.
 * *.authed.spec.js testleri bu kayıtlı oturumu kullanarak girişli başlar.
 *
 * Kimlik bilgileri .env dosyasından okunur:
 *   VOMENTA_EMAIL=...
 *   VOMENTA_PASSWORD=...
 */
setup('kimlik doğrula', async ({ page }) => {
  const email = process.env.VOMENTA_EMAIL;
  const password = process.env.VOMENTA_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'VOMENTA_EMAIL ve VOMENTA_PASSWORD .env dosyasında tanımlı olmalı. ' +
        '.env.example dosyasını .env olarak kopyalayıp doldurun.'
    );
  }

  await page.goto('/');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  // Giriş başarılıysa "Welcome back" başlığı kaybolur (login sayfasından ayrılırız).
  await expect(
    page.getByRole('heading', { name: 'Welcome back' })
  ).toBeHidden({ timeout: 20000 });

  await page.context().storageState({ path: authFile });
});
