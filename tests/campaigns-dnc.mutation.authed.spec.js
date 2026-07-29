// @ts-check
import { test, expect } from './fixtures/test.js';
import { buildDncEntry } from './data/factories.js';

/**
 * KAMPANYALAR → DNC LİSTELERİ — VERİ-DEĞİŞTİREN AKIŞ (staging/ayrılmış hesap)
 *
 * Keşif + kanıt: docs/kampanyalar-kesif/dnc/NOTLAR.md.
 * Salt-okunur spec'te L3 = N/A bırakılan katmanı (numara GERÇEKTEN ekleniyor mu +
 * listede görünüyor mu + silinebiliyor mu) izole ortamda kapatır.
 *
 * PROD'da çalıştırılmaz: @mutation etiketi + mutationGuard fixture'ı → production'da
 * engelli (playwright.config.js grepInvert @mutation ile prod'dan tamamen dışlanır).
 *
 * DURUM: test.fixme — GÜVENLİ TEARDOWN teyidi bekliyor. Keşifte tenant'ta 0 DNC
 *   kaydı vardı → satır Actions hücresindeki silme kontrolü GÖZLEMLENEMEDİ. Ekleme
 *   akışı doğrulandı (POST /api/v1/dnc gövde {phoneNumber,reason,source}, route ile
 *   yakalandı). create→list→delete döngüsü staging'de silme yolu (UI Actions veya
 *   yetkili API DELETE) doğrulanınca açılacak.
 */
test.describe('DNC Listeleri — mutasyonları @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Güvenli teardown bekliyor: DNC satır silme kontrolü (0 kayıtta) gözlemlenmedi; staging API DELETE/teardown teyidi gerekli.');

  test('L3 görev OK: Add Number uçtan uca DNC kaydı ekliyor (create → listede görünür → cleanup)', async ({
    app,
    page,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('DNC numarası ekleme (POST /api/v1/dnc)');
    const data = buildDncEntry();

    // TEMİZLİK (LIFO): eklenen numarayı geri sil (staging teardown yolu ile).
    testEntity.cleanup(async () => {
      // TODO(staging): DNC kaydı için doğrulanmış silme yolu (satır Actions veya API DELETE).
      const dnc = app.dncList;
      await dnc.open();
      await dnc.searchInput.fill(data.phoneNumber);
      // Silme kontrolü keşifte gözlemlenmedi; staging'de doğrulanınca burası bağlanacak.
    }, `dnc:${data.phoneNumber}`);

    const dnc = app.dncList;
    await dnc.open();
    await dnc.openAddDialog();
    await dnc.phoneInput.fill(data.phoneNumber);
    await dnc.selectReason(data.reason);
    await dnc.addSubmit.click();

    // L3: kayıt gerçekten oluştu → dialog kapanır + numara listede görünür.
    await expect(dnc.dialog).toBeHidden({ timeout: 10000 });
    await dnc.searchInput.fill(data.phoneNumber);
    await expect(dnc.rows.filter({ hasText: data.phoneNumber }).first()).toBeVisible({ timeout: 10000 });
  });
});
