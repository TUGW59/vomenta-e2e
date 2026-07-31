// @ts-check
import { test, expect } from './fixtures/test.js';
import { testEntityName } from './data/factories.js';
import { WorkforceSurveysPage } from './pages/WorkforceSurveysPage.js';

/**
 * İŞ GÜCÜ › CSAT ANKETLERİ — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation).
 *
 * Anketler ayrı rotada (`/workforce/surveys`) TAM CRUD sunar (canlı doğrulandı):
 *   oluştur (Anket oluştur → Gönder) → sil (çöp → "Anketi sil" onay → Sil).
 * Bu yüzden gerçek 0 → 1 → 0 yaşam döngüsü UI üzerinden GÜVENLE kapatılabilir
 * (Rozetler/Değerlendirmeler'in aksine — onlarda silme yolu yok/fixme).
 *
 * STAGING KİLİDİ (config/environment.js · mutationGuard):
 *   Kilit 1 — `ALLOW_MUTATING_TESTS=true` yoksa @mutation her yerde dışlanır.
 *   Kilit 2 — staging origin + beklenen `/auth/me` tenant kimliği eşleşir.
 *   Çalıştırma: yalnızca ayrılmış staging tenant'ında `npm run test:mutation`.
 *
 * GÜVENLİK: test `mutationGuard` ile başlar; `testEntity.create` rollback'i create
 *   ÖNCESİ kaydeder (action patlasa da cleanup çalışır) ve benzersiz
 *   `VOMENTA_E2E_SURVEY_*` adını izleyerek `0 → 1 → 0` doğrular; teardown finally
 *   ile garanti (deleteAllContaining ile idempotent).
 */
test.describe('İş Gücü › Anketler — L3 mutasyonları @regression @mutation', () => {
  test.describe.configure({ retries: 0 });

  test('L3 görev OK: Anket oluştur kalıcı kayıt yaratıyor ve silinebiliyor (0→1→0)', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('İş Gücü: CSAT anketi oluştur/sil');
    const s = app.workforceSurveys;
    const key = testEntityName('SURVEY'); // VOMENTA_E2E_SURVEY_<benzersiz>

    // finally ile teardown garanti: baseline patlasa bile orphan bırakmayız.
    try {
      await testEntity.create({
        label: 'workforce-survey',
        key,
        baseline: () => s.countContaining(key),
        cleanup: () => s.deleteAllContaining(key),
        action: async () => {
          await s.open();
          const dialog = await s.openCreateDialog();
          await s.fillSurveyName(dialog, key);
          await s.submitCreate(dialog, key);
          return { key };
        },
      });

      // Kalıcı kayıt gözlemlenebilir: adı taşıyan satır tabloda görünür.
      await expect(s.rowByName(key)).toBeVisible();
    } finally {
      // testEntity teardown otomatik koşar; ek güvenlik olarak açık temizlik.
      await s.deleteAllContaining(key).catch(() => {});
    }
  });
});
