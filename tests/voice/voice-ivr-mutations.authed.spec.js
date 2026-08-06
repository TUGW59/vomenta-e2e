// @ts-check
import { test, expect } from '../fixtures/test.js';

/**
 * VOICE › IVR — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo (0→1→0): "Create IVR" ile taslak IVR oluştur (POST 2xx) → listede doğrula →
 * teardown'da sil. `testEntity.create` create-öncesi baseline'ı kaydeder ve rollback'i garanti eder.
 *
 * DURUM: test.fixme — IVR oluşturmak KALICI kayıt üretir; production salt-okunur. POST/DELETE
 *   uçları + dialog alan seçicileri staging'de teyit edilecek, sonra fixme kaldırılacak.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da grepInvert ile hiç çalışmaz.
 */
test.describe('IVR — L3 mutasyonu (staging) @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: IVR create POST + delete DELETE uçları + dialog seçicileri.');

  test('L3 görev OK: IVR oluştur → listede doğrula → sil', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Voice: IVR oluştur + sil');
    const v = app.voiceSub('ivr');
    await v.open();

    const name = `E2E-TEST-SILINECEK-ivr-${Date.now()}`;
    await testEntity.create({
      label: `voice-ivr:${name}`,
      key: name,
      baseline: async () => v.page.getByRole('row').count(),
      cleanup: async () => {
        // TODO(staging): oluşturulan IVR'yi sil (satır aksiyonu → DELETE 2xx).
      },
      action: async () => {
        await v.page.getByRole('button', { name: 'Create IVR', exact: true }).click();
        await expect(v.page.getByRole('dialog')).toBeVisible();
        // TODO(staging): adı gir + gerekli alanları doldur → Kaydet (POST 2xx).
      },
    });

    await expect(v.page.getByText(name, { exact: true })).toBeVisible();
  });
});
