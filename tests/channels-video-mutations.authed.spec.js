// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * KANALLAR › VIDEO — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: bir video ayarını (kalite/fps) değiştir → Save Changes → PUT 2xx → eski değere döndür.
 *
 * DURUM: test.fixme — "Save Changes" video config'ini KALICI günceller; production salt-okunur.
 *   Güvenli 0→1→0 yalnız staging'de + ayrılmış tenant'ta yapılabilir; geri-alma ucu
 *   (PUT /channels/video/config eski gövde) staging'de teyit edilecek.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
test.describe('Video — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: video ayarı geri-alma ucu (PUT /channels/video/config).');

  test('L3 görev OK: video ayarını değiştir → kaydet → eski değere döndür', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Video: ayarı güncelle + geri al');
    const c = app.channelVideo;
    await c.open();
    testEntity.cleanup(async () => {
      // TODO(staging): önceki video config'ini PUT ile geri yükle.
    }, 'video:config');
    // TODO(staging): kalite/fps değiştir → Save Changes → PUT 2xx → doğrula → geri al.
    await expect(c.saveButton).toBeVisible();
  });
});
