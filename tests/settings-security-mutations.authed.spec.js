// @ts-check
import { test, expect } from './fixtures/test.js';
import { SecurityPage } from './pages/SecurityPage.js';

/**
 * AYARLAR › GÜVENLİK — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo (geri-döndürülebilir): bir Password Policy switch'ini (ör. "Require special character")
 * oku → tersine çevir → Save Password Policy → yeniden yükle → kalıcı doğrula → geri al.
 *
 * DURUM: test.fixme — Güvenlik config'i HASSAS (2FA zorlama, oturum sonlandırma, IP allowlist,
 *   şifre politikası tüm kullanıcıları etkiler). Yalnız ayrılmış staging tenant'ında, düzenli bir
 *   switch-toggle+revert ile ve save endpoint teyidiyle koşulmalı. Prod salt-okunur; teyit sonrası
 *   test.fixme kalkar.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
test.describe('Güvenlik — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: hassas config; policy switch toggle+revert + save endpoint.');

  test('L3 görev OK: password policy switch toggle → Save → kalıcı → geri al', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Güvenlik: password policy switch toggle + geri al');
    const s = app.security;
    await s.open();

    testEntity.cleanup(async () => {
      // TODO(staging): switch'i orijinal durumuna geri al + Save.
    }, 'security-policy-restore');

    // TODO(staging): "Require special character" switch oku → toggle → Save Password Policy →
    // yeniden yükle → kalıcı doğrula → geri al.
    await expect(s.savePolicyButton).toBeVisible();
  });
});
