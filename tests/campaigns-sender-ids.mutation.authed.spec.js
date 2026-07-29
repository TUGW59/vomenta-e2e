// @ts-check
import { test, expect } from './fixtures/test.js';
import { buildSenderId } from './data/factories.js';
import { SenderIdsPage } from './pages/SenderIdsPage.js';

/**
 * KAMPANYALAR → GÖNDERİCİ KİMLİKLERİ — VERİ-DEĞİŞTİREN AKIŞ (staging/ayrılmış hesap)
 *
 * Keşif + kanıt: docs/kampanyalar-kesif/sender-ids/NOTLAR.md.
 * Salt-okunur spec'te L3 = N/A bırakılan katmanı (talep GERÇEKTEN oluşuyor mu)
 * izole ortamda kapatır.
 *
 * Bu akış canlı panelde bir MUTATION'dır ve PROD'da çalıştırılmaz:
 *   - @mutation etiketi + mutationGuard → production'da engelli
 *     (playwright.config.js grepInvert @mutation ile prod'dan tamamen dışlanır).
 *
 * DURUM: test.fixme — GÜVENLİ TEARDOWN teyidi bekliyor. Keşifte gözlemlendi ki
 *   APPROVED satırların Actions hücresi BOŞ (silme kontrolü yok); yeni talep
 *   PENDING doğar ama PENDING satırların UI silme yolu henüz gözlemlenemedi
 *   (tenant'ta pending kayıt yoktu). Bu yüzden create→list→delete döngüsü
 *   staging'de yetkili API DELETE veya seed/teardown ile kanıtlanana kadar
 *   fixme. Oluşturma akışının kendisi keşifte doğrulandı (POST /sender-ids
 *   gövdesi {senderId,senderType,purpose}, route ile yakalandı).
 */
test.describe('Gönderici Kimlikleri — mutasyonları @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Güvenli teardown bekliyor: PENDING sender-id UI silme yolu doğrulanmadı; staging API DELETE/teardown teyidi gerekli.');

  test('L3 görev OK: dialog uçtan uca gönderici kimliği TALEBİ oluşturuyor (create → listede PENDING → cleanup)', async ({
    app,
    page,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('Gönderici kimliği talebi (POST /api/v1/sender-ids)');
    const data = buildSenderId();

    // TEMİZLİK (LIFO): oluşturulan talebi geri sil (staging teardown yolu ile).
    testEntity.cleanup(async () => {
      // TODO(staging): PENDING sender-id için doğrulanmış silme yolu (UI veya API DELETE).
      const sp = app.senderIds;
      await sp.open();
      await sp.selectStatus('Pending');
      const row = sp.rows.filter({ hasText: data.senderId }).first();
      if (await row.count()) {
        // Silme kontrolü keşifte gözlemlenmedi; staging'de doğrulanınca burası bağlanacak.
      }
    }, `sender-id:${data.senderId}`);

    // Talep dialogunu doldur ve gönder.
    const sp = app.senderIds;
    await sp.open();
    await sp.openRequestDialog();
    await sp.senderIdInput.fill(data.senderId);
    await sp.purposeInput.fill(data.purpose);
    await sp.submitButton.click();

    // L3: talep gerçekten oluştu → dialog kapanır + listede PENDING olarak görünür.
    await expect(sp.dialog).toBeHidden({ timeout: 10000 });
    await sp.selectStatus('Pending');
    await expect(sp.rows.filter({ hasText: data.senderId }).first()).toBeVisible({ timeout: 10000 });
    await expect(
      sp.rows.filter({ hasText: data.senderId }).first().getByText('PENDING', { exact: true })
    ).toBeVisible();
  });
});
