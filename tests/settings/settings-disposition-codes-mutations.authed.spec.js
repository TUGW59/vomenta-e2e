// @ts-check
import { test, expect } from '../fixtures/test.js';

/**
 * AYARLAR › SONUÇ KODLARI — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: Add Code ile benzersiz kod oluştur → tabloda görün → sil.
 *
 * DURUM: test.fixme — Satır aksiyon ikonları (edit/delete) aria-label taşımıyor; prod salt-okunur
 *   olduğundan silme/onay akışı doğrulanamadı. Staging'de oluşturma (POST /disposition-codes) +
 *   silme (DELETE) yolu teyit edilip cleanup doldurulacak.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
const uniqueCode = () => `PW_AUTO_${Date.now().toString(36).toUpperCase()}`;

test.describe('Sonuç Kodları — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: satır silme yolu (aksiyon ikonları aria-label\'sız).');

  test('L3 görev OK: kod oluştur → tabloda görün → sil', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Sonuç Kodları: kod oluştur + sil');
    const d = app.dispositionCodes;
    const code = uniqueCode();
    await d.open();

    testEntity.cleanup(async () => {
      // TODO(staging): oluşturulan kodu satır aksiyonundan / DELETE ile sil.
    }, `disposition:${code}`);

    const dialog = await d.openAddDialog();
    await dialog.getByRole('textbox').first().fill(code);
    // TODO(staging): Label/Category doldur → Create → POST 2xx → tabloda gör → sil.
    await expect(dialog).toBeVisible();
  });
});
