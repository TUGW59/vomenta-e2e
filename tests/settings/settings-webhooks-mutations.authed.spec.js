// @ts-check
import { test, expect } from '../fixtures/test.js';
import { WebhooksPage } from '../pages/WebhooksPage.js';

/**
 * AYARLAR › WEBHOOKS — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: Add Webhook ile benzersiz URL'li webhook oluştur → listede görün → sil.
 *
 * DURUM: test.fixme — Liste prod'da boş; satır silme aksiyonu yalnız webhook varken görünür.
 *   Staging'de POST/DELETE /api/v1/webhooks teyit edilip cleanup doldurulacak.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
const uniqueUrl = () => `https://pw-auto-${Date.now().toString(36)}.example.org/webhook`;

test.describe('Webhooks — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: webhook oluşturma + satır silme yolu (liste prod\'da boş).');

  test('L3 görev OK: webhook oluştur → listede görün → sil', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Webhooks: webhook oluştur + sil');
    const w = app.webhooks;
    const url = uniqueUrl();
    await w.open();

    testEntity.cleanup(async () => {
      // TODO(staging): oluşturulan webhook'u satır aksiyonundan / DELETE ile sil.
    }, `webhook:${url}`);

    const dialog = await w.openAddDialog();
    await dialog.getByPlaceholder('https://example.com/webhook').fill(url);
    // TODO(staging): Secret + Events → Add → POST /webhooks 2xx → listede gör → sil.
    await expect(dialog).toBeVisible();
  });
});
