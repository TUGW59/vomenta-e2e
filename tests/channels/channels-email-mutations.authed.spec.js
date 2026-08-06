// @ts-check
import { test, expect } from '../fixtures/test.js';

/**
 * KANALLAR › EMAIL — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: Add Account ile benzersiz e-posta hesabı ekle → listede görün → sil.
 *
 * DURUM: test.fixme — Hesap ekleme gerçek IMAP/SMTP kimlik bilgisi ve doğrulama ister;
 *   production salt-okunur. Güvenli 0→1→0 (ekle→gör→sil) yalnız staging'de + ayrılmış
 *   tenant'ta, sahte SMTP ile yapılabilir. Silme ucu staging'de teyit edilecek.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
const uniqueEmail = () => `pw_auto_${Date.now().toString(36)}@example.com`;

test.describe('E-posta — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: hesap ekleme sahte SMTP + silme ucu.');

  test('L3 görev OK: e-posta hesabı ekle → listede görün → sil', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Email: hesap ekle + sil');
    const c = app.channelEmail;
    const email = uniqueEmail();
    await c.open();
    testEntity.cleanup(async () => {
      // TODO(staging): oluşturulan hesabı DELETE ile sil.
    }, `email:${email}`);
    const dialog = await c.openAddAccountDialog();
    // TODO(staging): formu doldur → kaydet → POST 2xx → listede gör → sil → yok.
    await expect(dialog).toBeVisible();
  });
});
