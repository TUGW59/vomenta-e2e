// @ts-check
import { test, expect } from '../fixtures/test.js';

/**
 * AYARLAR › API ANAHTARLARI — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: Create Key ile benzersiz adlı anahtar oluştur → listede görün → sil/revoke.
 *
 * DURUM: test.fixme — Liste prod'da boş; oluşturma bir kez gösterilen gizli anahtar üretir ve
 *   satır silme/revoke aksiyonu yalnız anahtar varken görünür (prod'da doğrulanamadı). Staging'de
 *   POST/DELETE /api/v1/settings/api-keys teyit edilip cleanup doldurulacak.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
const uniqueName = () => `PW_AUTO_KEY_${Date.now().toString(36).toUpperCase()}`;

test.describe('API Anahtarları — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: anahtar oluşturma + revoke/sil yolu (liste prod\'da boş).');

  test('L3 görev OK: API anahtarı oluştur → listede görün → sil', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('API Anahtarları: anahtar oluştur + sil');
    const a = app.apiKeys;
    const name = uniqueName();
    await a.open();

    testEntity.cleanup(async () => {
      // TODO(staging): oluşturulan anahtarı satır aksiyonundan / DELETE ile sil.
    }, `apikey:${name}`);

    const dialog = await a.openCreateDialog();
    await dialog.getByRole('textbox').first().fill(name);
    // TODO(staging): izinler + expiration → Create Key → POST 2xx → listede gör → sil.
    await expect(dialog).toBeVisible();
  });
});
