// @ts-check
import { test, expect } from './fixtures/test.js';
import { buildSmsTemplate } from './data/factories.js';

/**
 * KAMPANYALAR → ŞABLONLAR — VERİ-DEĞİŞTİREN AKIŞ (staging/ayrılmış hesap)
 *
 * Keşif + kanıt: docs/kampanyalar-kesif/templates/NOTLAR.md.
 * Salt-okunur spec'te L3 = N/A bırakılan katmanı (şablon GERÇEKTEN oluşuyor mu +
 * listede görünüyor mu + silinebiliyor mu) izole ortamda kapatır.
 *
 * PROD'da çalıştırılmaz: @mutation etiketi + mutationGuard fixture'ı → production'da
 * engelli (playwright.config.js grepInvert @mutation ile prod'dan tamamen dışlanır).
 *
 * NOT: Diğer kampanya alt-sayfalarının aksine BU spec `test.fixme` DEĞİL — Templates'te
 * silme yolu (satır Delete ikonu → onay → DELETE) keşifte DOĞRULANDI, yani
 * create→list→delete teardown döngüsü tam biliniyor. Yalnızca KENDİ oluşturduğu şablonu
 * hedefler; mevcut şablonlara dokunmaz. ALLOW_MUTATING_TESTS + staging tenant gerektirir.
 */
test.describe('SMS Şablonları — mutasyonları @regression @mutation', () => {
  test.describe.configure({ retries: 0 });

  test('L3 görev OK: New Template uçtan uca şablon OLUŞTURUYOR ve siliyor (create → listede görünür → delete → yok)', async ({
    app,
    page,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('Şablon oluşturma (POST /api/v1/channels/templates/sms)');
    const data = buildSmsTemplate();
    const tp = app.templates;

    // create + rollback'i yapısal garantiyle sırala: önce cleanup kaydı, sonra action.
    await testEntity.create({
      label: `template:${data.name}`,
      // TEMİZLİK (LIFO): yalnız KENDİ oluşturduğumuz şablonu satır Delete ikonuyla sil + yokluğunu doğrula.
      cleanup: async () => {
        await tp.open();
        const row = tp.row(data.name);
        if (await row.count()) {
          await tp.rowAction(row, 'delete').click();
          await expect(tp.confirmDialog).toBeVisible();
          await tp.confirmDialog.getByRole('button', { name: /^Delete$/i }).click();
          await expect(tp.confirmDialog).toBeHidden();
        }
        // Yokluk doğrulaması: silme sonrası satır listede kalmamalı.
        await expect(tp.row(data.name)).toHaveCount(0, { timeout: 10000 });
      },
      action: async () => {
        await tp.open();
        await tp.openCreateDialog();
        await tp.nameInput.fill(data.name);
        await tp.bodyInput.fill(data.content);
        await tp.createSubmit.click();
        await expect(tp.dialog).toBeHidden({ timeout: 10000 });
      },
    });

    // L3: şablon gerçekten oluştu → listede adıyla görünüyor.
    await expect(tp.row(data.name)).toBeVisible({ timeout: 10000 });
    await expect(tp.row(data.name)).toContainText(data.name);
  });
});
