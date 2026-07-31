// @ts-check
import { test, expect } from './fixtures/test.js';
import { testEntityName } from './data/factories.js';
import { WorkforceBadgesPage } from './pages/WorkforceBadgesPage.js';

/**
 * İŞ GÜCÜ › ROZETLER — L3 mutasyonu (SÜRELİ İSTİSNA / test.fixme).
 *
 * ┌─ SÜRELİ MUTATION İSTİSNASI ────────────────────────────────────────────────┐
 * │ mode:            fixme                                                       │
 * │ reason:          Rozet UI'da yalnız OLUŞTURULUR; satırda düzenle/sil YOK →   │
 * │                  güvenli teardown (0→1→0) UI'dan kapatılamaz. Bilinen ürün   │
 * │                  hatası: WORKFORCE-BADGES-NO-EDIT-DELETE (known-bugs.js).    │
 * │ owner:           quality-guild (E2E)                                         │
 * │ expiry:          2026-09-30                                                  │
 * │ removalCondition: Backend/DB destekli silme (veya UI düzenle/sil) staging'de │
 * │                  kanıtlanınca fixme kaldırılır ve testEntity.create 0→1→0    │
 * │                  yaşam döngüsüne geçilir. Ayrıca orphan kaydı                │
 * │                  E2E-TEST-SILINECEK-badge temizlenmelidir.                   │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * STAGING KİLİDİ: `ALLOW_MUTATING_TESTS=true` + staging tenant (mutationGuard).
 * Prod'da @mutation grepInvert ile zaten dışlanır.
 */
test.describe('İş Gücü › Rozetler — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  // Silme yolu (teardown) kanıtlanana kadar devre dışı — orphan bırakmayı önler.
  test.fixme(
    true,
    'Rozet UI silme sunmuyor (WORKFORCE-BADGES-NO-EDIT-DELETE); güvenli 0→1→0 teardown yok.'
  );

  test('L3 görev OK: Rozet oluştur kalıcı kayıt yaratıyor (silme yolu gelince aktifleşir)', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('İş Gücü: rozet oluştur/sil');
    const b = app.workforceBadges;
    const key = testEntityName('BADGE'); // VOMENTA_E2E_BADGE_<benzersiz>

    // Silme yolu kanıtlandığında bu blok testEntity.create(0→1→0) ile aktifleşir.
    await testEntity.create({
      label: 'workforce-badge',
      key,
      baseline: async () => {
        await b.open();
        return b.rowByName(key).count();
      },
      // removalCondition kanıtlanınca gerçek silme ile değiştirilecek.
      cleanup: async () => {
        throw new Error(
          'Rozet silme yolu yok (WORKFORCE-BADGES-NO-EDIT-DELETE); teardown kanıtlanmadı.'
        );
      },
      action: async () => {
        const dialog = await b.openCreateDialog();
        await b.fillBadgeName(dialog, key);
        await b.submitCreate(dialog, key);
        return { key };
      },
    });

    await expect(b.rowByName(key)).toBeVisible();
  });
});
