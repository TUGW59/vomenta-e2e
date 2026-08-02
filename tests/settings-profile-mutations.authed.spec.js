// @ts-check
import { test, expect } from './fixtures/test.js';
import { ProfilePage } from './pages/ProfilePage.js';

/**
 * AYARLAR › PROFİL — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * 3 katmanlı standardın L3 katmanı: "Save changes" kalıcı kaydı GERÇEKTEN yazıyor mu?
 * Senaryo (geri-döndürülebilir): mevcut Telefon değerini oku → yeni test değeri yaz →
 * Save changes (PATCH /auth/me) → sayfayı yeniden yükle → yeni değer KALICI mı doğrula →
 * cleanup ile ESKİ değere geri al. Yalnız Telefon alanına dokunulur; ad/e-posta/dil
 * değişmez. Şifre/2FA/Revoke gibi yan-etkili kontroller BURADA DA test edilmez.
 *
 * STAGING KİLİDİ (config/environment.js · mutationGuard):
 *   Kilit 1 — ALLOW_MUTATING_TESTS=true yoksa @mutation her yerde dışlanır.
 *   Kilit 2 — staging origin + beklenen `/auth/me` tenant kimliği eşleşir.
 *   Çalıştırma: yalnızca ayrılmış staging tenant'ında `npm run test:mutation`.
 *
 * GÜVENLİK: mutationGuard ile başlar; testEntity.cleanup ORİJİNAL telefonu değişiklikten
 *   ÖNCE kaydeder ve test ortada patlasa bile eski değere geri döner. Uç: PATCH /auth/me.
 */
const I18N = ProfilePage.I18N;
// Ayrılmış otomasyon telefon değeri (E.164) — gerçek bir numarayı ezmemek için sabit test deseni.
const TEST_PHONE = '+12025550123';

test.describe('Profil — L3 mutasyonu @regression @mutation', () => {
  // Retry yok: mutation retry'da churn/yarı-yazılmış durum riski yaratır.
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: telefon PATCH /auth/me kalıcılık + geri-alma yolu ayrılmış staging tenant\'ında doğrulanmadı.');

  test('L3 görev OK: Telefon değiştir → Save → kalıcı → eski değere geri al', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('Profil: Telefon güncelle + geri al');
    const p = app.profile;

    await p.open();
    const original = await p.phoneValue();

    // Bulletproof cleanup: ne olursa olsun orijinal telefonu geri yaz (LIFO, teardown'da).
    testEntity.cleanup(async () => {
      await p.open();
      const current = await p.phoneValue();
      if (current !== original) await p.savePhone(original);
    }, `profile-phone-restore:${original || '(boş)'}`);

    // 1) DEĞİŞTİR + KAYDET — GERÇEK PATCH /auth/me
    expect(TEST_PHONE, 'test değeri orijinalden farklı olmalı').not.toBe(original);
    await p.savePhone(TEST_PHONE);

    // 2) KALICILIK (L3): sayfayı yeniden yükle, yeni değer sunucudan geri geliyor mu?
    await p.open();
    await expect(p.phoneInput).toHaveValue(TEST_PHONE, { timeout: 10000 });

    // 3) GERİ AL (test içinde de açıkça — cleanup yine garanti eder)
    await p.savePhone(original);
    await p.open();
    await expect(p.phoneInput).toHaveValue(original, { timeout: 10000 });
  });
});
