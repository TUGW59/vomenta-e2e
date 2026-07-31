// @ts-check
import { test, expect } from './fixtures/test.js';
import { testEntityName } from './data/factories.js';

/**
 * İŞ GÜCÜ › CSAT ANKETLERİ — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * 3 katmanlı standardın L3 katmanı. Kullanıcı akışının TAM yaşam döngüsü:
 *   1) OLUŞTUR  — "Anket oluştur" → Ad → Gönder (GERÇEK POST …/gamification/surveys)
 *   2) GÖRÜNTÜLE — "Sonuçlar" → yanıt özeti diyaloğu (henüz yanıt yok)
 *   3) DÜZENLE  — kalem → "Anketi düzenle" → Ad değiştir → Kaydet (PATCH …/surveys/{id})
 *   4) SİL      — çöp → "Anketi sil" onayı → Sil (DELETE …/surveys/{id}) → satır gider
 *
 * Bu yaşam döngüsü 30 Tem 2026 CANLIDA (test hesabı) uçtan uca doğrulandı; bu yüzden
 * spec `test.fixme` DEĞİL — `testEntity.create` ile 0→1→0 baseline garantisi taşır.
 *
 * STAGING KİLİDİ (config/environment.js · mutationGuard):
 *   Kilit 1 — ALLOW_MUTATING_TESTS=true yoksa @mutation her yerde dışlanır.
 *   Kilit 2 — staging origin + beklenen `/auth/me` tenant kimliği eşleşir.
 *   Çalıştırma: yalnız ayrılmış staging tenant'ında `npm run test:mutation`.
 *
 * GÜVENLİK: mutationGuard ile başlar; testEntity.create rollback'i create'ten ÖNCE
 *   kaydeder ve oluşturulan anketi (rename'den bağımsız) benzersiz taban-token'ına
 *   göre siler, `0→1→0` baseline'ını kanıtlar. Yalnız bu testin oluşturduğu ankete
 *   dokunulur; satır her zaman ada/token'a göre seçilir.
 */
test.describe('CSAT anketleri — L3 mutasyonları @regression @mutation', () => {
  // Retry yok: mutation retry'da yeniden kayıt oluşturup churn/orphan riski yaratır.
  test.describe.configure({ retries: 0 });

  test('L3 görev OK: anket oluştur → Sonuçlar → düzenle → sil', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('CSAT anketleri: oluştur + görüntüle + düzenle + sil');
    const s = app.workforceSurveys;
    const key = testEntityName('SURVEY'); // VOMENTA_E2E_SURVEY_… (rename sonrası korunur)
    const editedName = `${key}-EDIT`;

    // 1) OLUŞTUR — GERÇEK POST; baseline 0→1, teardown rollback ile 1→0.
    await testEntity.create({
      label: `survey:${key}`,
      key,
      baseline: () => s.countContaining(key),
      cleanup: () => s.deleteAllContaining(key),
      action: async () => {
        await s.open();
        const dialog = await s.openCreateDialog();
        await s.fillSurveyName(dialog, key);
        await s.submitCreate(dialog, key);
        return key;
      },
    });

    // 2) GÖRÜNTÜLE — oluşturulan anketin "Sonuçlar" diyaloğu açılıyor (boş yanıt durumu).
    const results = await s.openResults(key);
    await expect(
      results.getByText(/No responses yet|Bu anket için henüz yanıt yok/i)
    ).toBeVisible({ timeout: 10000 });
    await s.page.keyboard.press('Escape');

    // 3) DÜZENLE — kalem → Ad değiştir → Kaydet; yeni ad tabloda görünür.
    const edit = await s.openEditDialog(key);
    await s.renameTo(edit, editedName);
    await expect(s.rowByName(key)).toHaveCount(0, { timeout: 10000 });

    // 4) SİL — çöp → "Anketi sil" onayı → Sil; satır tablodan kalkıyor.
    await s.deleteByName(editedName);
    await expect(s.rowByName(editedName)).toHaveCount(0, { timeout: 10000 });
  });
});
