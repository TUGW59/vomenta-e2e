// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * AYARLAR › UYUMLULUK — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: Log Consent ile bir onay kaydı oluştur → listede görün → geri al (Revoke) /
 * temizle. GDPR "Create Request" de kalıcı kayıt üretir.
 *
 * DURUM: test.fixme — Uyumluluk kayıtları (consent / GDPR request) UI'da HARD-DELETE
 *   sunmuyor (yalnız "Revoke" durum değiştirir, kaydı SİLMEZ). Zero-orphan temizliği için
 *   staging'de bir purge/delete API ucunun teyidi gerekir; teyit sonrası cleanup doldurulup
 *   test.fixme kaldırılır. Fabrikasyon yerine açık N/A (AGENTS.md orphan-sıfır standardı).
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz (grepInvert + tenant kilidi).
 */
test.describe('Uyumluluk — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(
    true,
    'Staging teyidi bekliyor: consent/GDPR kaydı için zero-orphan temizlik (purge/delete) ucu. ' +
    'UI yalnızca Revoke (durum değiştirir) sunuyor; kalıcı kayıt silinemiyor.'
  );

  test('L3 görev OK: onay kaydı oluştur → listede görün → temizle', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('Uyumluluk: onay kaydı oluştur + temizle');
    const c = app.compliance;
    await c.open();

    // TODO(staging): benzersiz Contact ID ile Log Consent gönder; cleanup ile kaydı purge et.
    testEntity.cleanup(async () => {
      // TODO(staging): DELETE /api/v1/compliance/consent/{id} (teyit edilecek).
    }, 'compliance-consent-purge');

    const dialog = await c.openDialog(c.logConsentButton);
    await expect(dialog).toBeVisible();
    // TODO(staging): alanları doldur → Log Consent → POST /compliance/consent 2xx → listede gör.
  });
});
