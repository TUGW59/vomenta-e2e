// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * KANALLAR › SMS — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: Add Sender ile benzersiz gönderici kimliği ekle → listede görün → sil.
 *
 * DURUM: test.fixme — Gönderici kimliği/SMPP kaydı kalıcı; production salt-okunur.
 *   Güvenli 0→1→0 (ekle→gör→sil) yalnız staging'de + ayrılmış tenant'ta yapılabilir;
 *   POST /sender-ids + DELETE ucu staging'de teyit edilecek.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
const uniqueSender = () => `PWAUTO${Date.now().toString(36).toUpperCase()}`;

test.describe('SMS — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: POST /sender-ids + silme ucu.');

  test('L3 görev OK: gönderici kimliği ekle → listede görün → sil', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('SMS: gönderici kimliği ekle + sil');
    const c = app.channelSms;
    const sender = uniqueSender();
    await c.open();
    testEntity.cleanup(async () => {
      // TODO(staging): oluşturulan sender-id'yi DELETE ile sil.
    }, `sms-sender:${sender}`);
    const dialog = await c.openAddSenderDialog();
    // TODO(staging): sender adını gir → gönder → POST 2xx → listede gör → sil → yok.
    await expect(dialog).toBeVisible();
  });
});
