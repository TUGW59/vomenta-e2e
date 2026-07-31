// @ts-check
import { test, expect } from './fixtures/test.js';
import { testEntityName } from './data/factories.js';
import { WorkforceEvaluationsPage } from './pages/WorkforceEvaluationsPage.js';

/**
 * İŞ GÜCÜ › KALİTE DEĞERLENDİRMELERİ — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in)
 *
 * Senaryo: "Değerlendirme Oluştur" ile manuel değerlendirme oluştur → tabloda
 *   görün → satır aksiyonundan sil.
 *
 * DURUM: test.fixme — Oluşturma GERÇEK bir etkileşim ID'si (çağrı/konuşma) + gerçek
 *   temsilci gerektirir (dışa dönük, gerçek veriye bağlı) ve tablo prod'da boş
 *   olduğundan satır "İşlemler" (düzenle/sil) yolu gözlemlenemedi. Staging'de
 *   sabit bir etkileşim ID'si + POST/DELETE …/wfm/evaluations kanıtlanınca fixme
 *   kaldırılıp testEntity.create yaşam döngüsüne geçilecek.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da grepInvert ile çalışmaz.
 */
test.describe('Kalite değerlendirmeleri — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(
    true,
    'N/A: manuel değerlendirme gerçek etkileşim ID\'si + temsilci ister; create+sil ve orphan sayacı staging\'de kanıtlanmadı.'
  );

  test('L3 görev OK: değerlendirme oluştur → tabloda görün → sil', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('Kalite değerlendirmeleri: oluştur + sil');
    const e = app.workforceEvaluations;
    const key = testEntityName('EVAL');
    await e.open();

    testEntity.cleanup(async () => {
      // TODO(staging): oluşturulan değerlendirmeyi satır aksiyonundan / DELETE
      //   …/wfm/evaluations/{id} ile sil; orphan sayacını 0'a döndür.
    }, `evaluation:${key}`);

    const dialog = await e.openCreateDialog();
    // TODO(staging): geçerli Interaction ID + Interaction Type + Agent + Puan doldur →
    //   Değerlendirme Oluştur → POST 2xx → tabloda gör → sil.
    await expect(dialog.getByRole('textbox').first()).toBeVisible();
  });
});
