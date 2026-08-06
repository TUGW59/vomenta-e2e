// @ts-check
import { test, expect } from '../fixtures/test.js';

/**
 * AYARLAR › HAZIR YANITLAR — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: Create canned response ile benzersiz kayıt oluştur → tabloda görün → sil.
 *
 * DURUM: test.fixme — Tablo prod'da boş; satır silme aksiyonu yalnız kayıt varken görünür ve
 *   prod'da doğrulanamadı. Staging'de POST/DELETE /api/v1/chat/canned-responses teyit edilecek.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
const uniqueTitle = () => `PW_AUTO_CR_${Date.now().toString(36).toUpperCase()}`;

test.describe('Hazır Yanıtlar — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: oluşturma + satır silme yolu (tablo prod\'da boş).');

  test('L3 görev OK: hazır yanıt oluştur → tabloda görün → sil', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Hazır Yanıtlar: oluştur + sil');
    const c = app.cannedResponses;
    const title = uniqueTitle();
    await c.open();

    testEntity.cleanup(async () => {
      // TODO(staging): oluşturulan hazır yanıtı satır aksiyonundan / DELETE ile sil.
    }, `canned:${title}`);

    const dialog = await c.openCreateDialog();
    await dialog.getByRole('textbox').first().fill(title);
    // TODO(staging): Shortcode/Content doldur → Create → POST 2xx → tabloda gör → sil.
    await expect(dialog).toBeVisible();
  });
});
