// @ts-check
import { test as setup } from '@playwright/test';
import {
  authStatePath,
  credentialsFor,
} from '../config/environment.js';
import { LoginPage } from './pages/LoginPage.js';

/**
 * Vomenta'ya bir kez giriş yapar ve oturumu (cookies + localStorage) diske kaydeder.
 * *.authed.spec.js testleri bu kayıtlı oturumu kullanarak girişli başlar.
 *
 * Kimlik bilgileri .env dosyasından okunur:
 *   VOMENTA_EMAIL=...
 *   VOMENTA_PASSWORD=...
 */
setup('kimlik doğrula', async ({ page }, testInfo) => {
  const role = String(testInfo.project.metadata.role || 'default');
  const { email, password } = credentialsFor(role);

  await new LoginPage(page).login(email, password);
  await page.context().storageState({ path: authStatePath(role) });
});
