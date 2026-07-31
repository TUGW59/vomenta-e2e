// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * KANALLAR › SOCIAL MEDIA — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: bir platformu Connect ile bağla → bağlı görün → bağlantıyı kaldır.
 *
 * DURUM: test.fixme — "Connect" harici OAuth (Facebook/Instagram/…) akışı başlatır; otomatikleşemez
 *   ve production salt-okunur. Güvenli 0→1→0 yalnız staging'de + ayrılmış tenant'ta, sahte
 *   sağlayıcı/token ile mümkün. Bağlama/kaldırma ucu staging'de teyit edilecek.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
test.describe('Sosyal Medya — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: harici OAuth (sahte sağlayıcı) + bağlantı kaldırma ucu.');

  test('L3 görev OK: platform bağla → bağlı görün → bağlantıyı kaldır', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Social: platform bağla + kaldır');
    const c = app.channelSocial;
    await c.open();
    testEntity.cleanup(async () => {
      // TODO(staging): kurulan bağlantıyı DELETE ile kaldır.
    }, 'social:connection');
    // TODO(staging): Connect → sahte OAuth → bağlı durum → kaldır → yok.
    await expect(c.connectButtons.first()).toBeVisible();
  });
});
