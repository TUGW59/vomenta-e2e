// @ts-check
import { test, expect } from './fixtures/test.js';
import { IntegrationsPage } from './pages/IntegrationsPage.js';

/**
 * AYARLAR › ENTEGRASYONLAR — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: Add Webhook ile benzersiz URL'li webhook oluştur → tabloda görün → sil.
 *
 * DURUM: test.fixme — Webhook tablosu prod'da boş; satır silme + Request Access "Submit" yan-etkili
 *   (entegrasyon talebi gönderir). Staging'de POST/DELETE /api/v1/webhooks teyit edilecek.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
const uniqueUrl = () => `https://pw-auto-${Date.now().toString(36)}.example.org/webhook`;

test.describe('Entegrasyonlar — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: webhook oluşturma + satır silme yolu (tablo prod\'da boş).');

  test('L3 görev OK: webhook oluştur → tabloda görün → sil', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Entegrasyonlar: webhook oluştur + sil');
    const i = app.integrations;
    const url = uniqueUrl();
    await i.open();

    testEntity.cleanup(async () => {
      // TODO(staging): oluşturulan webhook'u satır aksiyonundan / DELETE ile sil.
    }, `webhook:${url}`);

    const dialog = await i.openDialog(i.addWebhookButton);
    await dialog.getByRole('textbox', { name: 'URL', exact: true }).fill(url);
    // TODO(staging): Secret + Events → Add → POST /webhooks 2xx → tabloda gör → sil.
    await expect(dialog).toBeVisible();
  });
});
