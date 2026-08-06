// @ts-check
import { test, expect } from '../fixtures/test.js';
import { TemplatesPage } from '../pages/TemplatesPage.js';

/**
 * AYARLAR › ŞABLONLAR — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: New Template ile benzersiz adlı şablon oluştur → tabloda görün → sil.
 *
 * DURUM: test.fixme — Tablo prod'da boş ("No templates in this category"); satır silme aksiyonu
 *   yalnız şablon varken görünür ve prod'da doğrulanamadı. Staging'de oluşturma (POST) + silme
 *   (DELETE) yolu teyit edilip cleanup doldurulacak.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
const uniqueName = () => `PW_AUTO_TPL_${Date.now().toString(36).toUpperCase()}`;

test.describe('Şablonlar — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: şablon oluşturma + satır silme yolu (tablo prod\'da boş).');

  test('L3 görev OK: şablon oluştur → tabloda görün → sil', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Şablonlar: şablon oluştur + sil');
    const t = app.templates;
    const name = uniqueName();
    await t.open();

    testEntity.cleanup(async () => {
      // TODO(staging): oluşturulan şablonu satır aksiyonundan / DELETE ile sil.
    }, `template:${name}`);

    const dialog = await t.openNewTemplateDialog();
    await dialog.getByRole('textbox').first().fill(name);
    // TODO(staging): Content doldur → Create → POST 2xx → tabloda gör → sil.
    await expect(dialog).toBeVisible();
  });
});
