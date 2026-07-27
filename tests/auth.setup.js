// @ts-check
import { test as setup } from '@playwright/test';
import { login } from './helpers';

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

  await login(page, email, password);
  await page.context().storageState({ path: authFile });
});
