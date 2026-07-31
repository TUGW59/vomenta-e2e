// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * KANALLAR › WEB CHAT — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: bir widget ayarını değiştir → Save Changes → PUT/PATCH 2xx → eski değere döndür.
 *
 * DURUM: test.fixme — "Save Changes" widget config'ini KALICI günceller; production salt-okunur
 *   olduğundan güvenli 0→1→0 (değiştir→doğrula→geri al) yalnız staging'de + ayrılmış tenant'ta
 *   yapılabilir. Geri-alma ucu (PUT /channels/webchat/config eski gövde) staging'de teyit edilecek.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
test.describe('Web Chat — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: widget ayarı geri-alma ucu (PUT /channels/webchat/config).');

  test('L3 görev OK: widget ayarını değiştir → kaydet → eski değere döndür', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Web Chat: widget ayarını güncelle + geri al');
    const c = app.channelWebchat;
    await c.open();
    testEntity.cleanup(async () => {
      // TODO(staging): önceki widget config'ini PUT ile geri yükle.
    }, 'webchat:config');
    // TODO(staging): ayarı değiştir → Save Changes → PUT 2xx → doğrula → geri al.
    await expect(c.saveButton).toBeVisible();
  });
});
