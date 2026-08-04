// @ts-check
import { existsSync, rmSync } from 'node:fs';
import { test as setup } from '@playwright/test';
import {
  authStatePath,
  credentialsFor,
} from '../config/environment.js';
import { LoginPage } from './pages/LoginPage.js';
import {
  runAuthWithGatewayRetry,
  MAX_AUTH_ATTEMPTS,
} from './support/gateway-retry.js';

/**
 * Vomenta'ya bir kez giriş yapar ve oturumu (cookies + localStorage) diske kaydeder.
 * *.authed.spec.js testleri bu kayıtlı oturumu kullanarak girişli başlar.
 *
 * Kimlik bilgileri .env dosyasından okunur:
 *   VOMENTA_EMAIL=...
 *   VOMENTA_PASSWORD=...
 *
 * Canlı sunucunun aralıklı 502/503/504 (nginx gateway) blip'lerine karşı login,
 * SINIRLI retry ile korunur (bkz. support/gateway-retry.js): en fazla
 * {@link MAX_AUTH_ATTEMPTS} deneme, YALNIZ gerçek gateway kanıtında. Yanlış
 * credential / 401-403 / locator / assertion hataları retry EDİLMEZ.
 */
setup('kimlik doğrula', async ({ page }, testInfo) => {
  const role = String(testInfo.project.metadata.role || 'default');
  const { email, password } = credentialsFor(role);
  const statePath = authStatePath(role);
  const loginPage = new LoginPage(page);

  await runAuthWithGatewayRetry(
    async () => {
      // Bayat storage-state'i HER denemeden ÖNCE kaldır; state yalnız login
      // TAM başarılı olunca yazılır (yarım/başarısız denemeden state kalmaz).
      if (existsSync(statePath)) rmSync(statePath, { force: true });

      await loginPage.login(email, password);

      // Buraya yalnız login tamamen başarılıysa gelinir → oturumu diske yaz.
      await page.context().storageState({ path: statePath });
    },
    {
      maxAttempts: MAX_AUTH_ATTEMPTS,
      onRetry: (attempt) => {
        // Teşhis: kaçıncı denemenin gateway blip'iyle düştüğü görünür (secret yok).
        // Sabit bekleme YOK (mimari kuralı): her retry taze bir login() =
        // yeni page.goto('/') → navigasyon süresi denemeleri doğal olarak aralar.
        console.warn(
          `[auth.setup] geçici ağ geçidi hatası; deneme ${attempt}/${MAX_AUTH_ATTEMPTS} tekrarlanıyor`
        );
      },
    }
  );
});
