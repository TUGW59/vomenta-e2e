// @ts-check
import { test, expect } from './fixtures/test.js';
import { testEntityName } from './data/factories.js';
import { WorkforceEvaluationsPage } from './pages/WorkforceEvaluationsPage.js';

/**
 * İŞ GÜCÜ › KALİTE DEĞERLENDİRMELERİ — L3 mutasyonu (SÜRELİ İSTİSNA / test.fixme).
 *
 * ┌─ SÜRELİ MUTATION İSTİSNASI ────────────────────────────────────────────────┐
 * │ mode:            fixme                                                       │
 * │ reason:          Manuel değerlendirme oluşturma GERÇEK bir etkileşim ID'si + │
 * │                  gerçek temsilci gerektirir (dışa dönük, gerçek veriye       │
 * │                  bağlı); tablo prod'da boş olduğundan satır sil yolu         │
 * │                  gözlemlenemedi → güvenli 0→1→0 teardown kanıtlanmadı.       │
 * │ owner:           quality-guild (E2E)                                         │
 * │ expiry:          2026-09-30                                                  │
 * │ removalCondition: Staging'de sabit bir test etkileşim ID'si + silme ucu      │
 * │                  (DELETE `…/wfm/evaluations/{id}`) kanıtlanınca fixme        │
 * │                  kaldırılır ve testEntity.create 0→1→0 yaşam döngüsüne       │
 * │                  geçilir.                                                    │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * STAGING KİLİDİ: `ALLOW_MUTATING_TESTS=true` + staging tenant (mutationGuard).
 * Prod'da @mutation grepInvert ile zaten dışlanır.
 */
test.describe('İş Gücü › Değerlendirmeler — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  // Gerçek etkileşim ID'si + silme ucu kanıtlanana kadar devre dışı.
  test.fixme(
    true,
    'Manuel değerlendirme gerçek etkileşim ID + temsilci gerektirir; staging silme ucu kanıtlanmadı.'
  );

  test('L3 görev OK: Değerlendirme oluştur kalıcı kayıt yaratıyor (staging kanıtı gelince aktifleşir)', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('İş Gücü: değerlendirme oluştur/sil');
    const e = app.workforceEvaluations;
    const key = testEntityName('EVALUATION');

    // removalCondition kanıtlandığında gerçek create+delete ile aktifleşir.
    await testEntity.create({
      label: 'workforce-evaluation',
      key,
      baseline: async () => {
        await e.open();
        return 0; // staging'de sabit etkileşim + silme ucu gelince gerçek sayaçla değişir
      },
      cleanup: async () => {
        throw new Error(
          'Değerlendirme silme ucu staging\'de kanıtlanmadı; teardown yok.'
        );
      },
      action: async () => {
        const dialog = await e.openCreateDialog();
        await expect(dialog.getByRole('textbox').first()).toBeVisible();
        // Gerçek etkileşim ID + temsilci staging fixture'ı gelince doldurulacak.
        return { key };
      },
    });

    expect(key).toContain('VOMENTA_E2E_');
  });
});
