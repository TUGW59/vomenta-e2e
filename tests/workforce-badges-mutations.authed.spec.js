// @ts-check
import { test, expect } from './fixtures/test.js';
import { testEntityName } from './data/factories.js';
import { WorkforceBadgesPage } from './pages/WorkforceBadgesPage.js';

/**
 * İŞ GÜCÜ › ROZETLER — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: "Rozet oluştur" ile benzersiz rozet oluştur → tabloda görün → SİL.
 *
 * DURUM: test.fixme — Rozet OLUŞTURMA canlıda çalışıyor (POST …/gamification/badges,
 *   toast "Rozet oluşturuldu"), ANCAK rozet satırında düzenle/sil kontrolü YOK ve
 *   API ile güvenli teardown kanıtlanamadı → `testEntity.create` 0→1→0 baseline'ı
 *   UI'dan kapatılamıyor (oluşturulan rozet orphan kalır). Silme yolu (UI veya
 *   staging DELETE ucu) kanıtlanınca fixme kaldırılıp testEntity.create'e geçilecek.
 *   Bkz. mutation-lifecycle.js istisnası + tests/workforce-badges.authed.spec.js bulgusu.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da grepInvert ile çalışmaz.
 */
test.describe('Rozetler — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(
    true,
    'N/A: rozet UI\'da düzenle/sil sunmuyor; güvenli teardown (0→1→0) kanıtlanana kadar fixme.'
  );

  test('L3 görev OK: rozet oluştur → tabloda görün → sil', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('Rozetler: oluştur + sil');
    const b = app.workforceBadges;
    const key = testEntityName('BADGE');
    await b.open();

    testEntity.cleanup(async () => {
      // TODO(staging): rozeti UI'dan (düzenle/sil eklenince) ya da DELETE
      //   …/gamification/badges/{id} ile sil; orphan sayacını 0'a döndür.
    }, `badge:${key}`);

    const dialog = await b.openCreateDialog();
    await b.fillBadgeName(dialog, key);
    await b.submitCreate(dialog, key);
    await expect(b.rowByName(key)).toBeVisible();
    // TODO(staging): satır silme yolunu doğrula → tablodan kalktığını assert et.
  });
});
