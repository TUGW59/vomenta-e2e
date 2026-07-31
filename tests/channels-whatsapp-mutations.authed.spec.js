// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * KANALLAR › WHATSAPP — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: Create Template ile benzersiz şablon oluştur → listede görün → sil.
 *
 * DURUM: test.fixme — Canlıda "WhatsApp Business API Not Configured" (şablon oluşturma
 *   bağlantı gerektiriyor) + production salt-okunur. Güvenli 0→1→0 yalnız staging'de +
 *   ayrılmış tenant'ta (bağlı WABA ile) yapılabilir; POST/DELETE templates/whatsapp teyit edilecek.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
const uniqueTemplate = () => `pw_auto_${Date.now().toString(36)}`;

test.describe('WhatsApp — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: bağlı WABA + şablon POST/DELETE ucu.');

  test('L3 görev OK: şablon oluştur → listede görün → sil', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('WhatsApp: şablon oluştur + sil');
    const c = app.channelWhatsapp;
    const name = uniqueTemplate();
    await c.open();
    testEntity.cleanup(async () => {
      // TODO(staging): oluşturulan şablonu DELETE /channels/templates/whatsapp ile sil.
    }, `wa-template:${name}`);
    // TODO(staging): Create Template → doldur → POST 2xx → listede gör → sil → yok.
    await expect(c.saveButton).toBeVisible();
  });
});
